import { fromEntries, keys } from "./condition";
import {
  SelectTableQueryBuilder,
  InsertTableQueryBuilder,
  UpdateTableQueryBuilder,
  DeleteTableQueryBuilder,
  TableQueryBuilder,
  Operation,
  select,
  insert,
  update,
  del
} from "./operation";
import schema from "./schema";
import axios from "axios";
import { TransactionBuilder, transaction } from "./transaction";

type Schema = schema.operations["getSchema"]["responses"]["200"]["content"]["application/json"];

type TableSchema = Schema["tables"][number];
type QuerySchema = NonNullable<Schema["queries"]>[number];

type Table = {
  name: TableSchema["name"];
  columns: TableSchema["columns"];
};
type View = {
  name: TableSchema["views"][number]["name"];
  columns: TableSchema["columns"];
};
type Insight = {
  name: TableSchema["insights"][number]["name"];
  columns: TableSchema["insights"][number]["columns"];
};
type Query = {
  name: NonNullable<QuerySchema["name"]>;
  columns: NonNullable<QuerySchema["columns"]>;
  params: NonNullable<QuerySchema["params"]>;
};

type TableQueryBuilderMapper<
  B extends TableQueryBuilder,
  T = Record<string, any>
> = {
  [key in keyof Omit<B, "build" | "instruction">]: (
    // @ts-ignore
    ...args: Parameters<B[key]>
  ) => TableQueryBuilderMapper<B, T>;
} & {
  exec: () => Promise<T>;
};

type ClientSelectTableQueryBuilder = TableQueryBuilderMapper<SelectTableQueryBuilder>;
type ClientInsertTableQueryBuilder = TableQueryBuilderMapper<
  InsertTableQueryBuilder,
  { id: string | number }
>;
type ClientUpdateTableQueryBuilder = TableQueryBuilderMapper<
  UpdateTableQueryBuilder,
  {
    id: string | number;
  }
>;
type ClientDeleteTableQueryBuilder = TableQueryBuilderMapper<
  DeleteTableQueryBuilder,
  {
    id: string | number;
  }
>;

type ClientTableQueryBuilder = {
  select: (fields?: "*" | string[]) => ClientSelectTableQueryBuilder;
  insert: (data: Record<string, any>) => ClientInsertTableQueryBuilder;
  update: (data: Record<string, any>) => ClientUpdateTableQueryBuilder;
  delete: () => ClientDeleteTableQueryBuilder;
};

type ClientTable = ClientTableQueryBuilder & {
  rows: (options?: {
    limit?: number;
    offset?: number;
    orderBy?: Record<string, "ASC" | "DESC">;
    params?: Record<string, any>;
    populate?: string[];
    fields?: string[];
  }) => Promise<Record<string, any>[]>;
  action: (column: string, rowId: string | number, params: any) => Promise<any>;
};
type ClientView = {
  rows: ClientTable["rows"];
};

type QoreClient = {
  tables: () => Table[];
  views: () => View[];
  insights: () => Insight[];
  queries: () => Query[];
  execute: (
    builderFn: Parameters<TransactionBuilder>[0]
  ) => Promise<Record<string, any>>;

  table: (table: string) => ClientTable;
  view: (view: string) => ClientView;
};

type ClientConfig = {
  url: string;
  schema: Schema;
  adminSecret?: string;
  token?: string;
};

export const createClient = (config: ClientConfig): QoreClient => {
  const axiosClient = axios.create({
    baseURL: config.url,
    headers: config.adminSecret
      ? { "x-qore-admin-secret": config.adminSecret }
      : config.token
      ? { Authorization: `Bearer ${config.token}` }
      : {}
  });

  const execute = async (operations: Operation[]) => {
    const { data } = await axiosClient.post(
      "/v1/execute",
      {
        operations
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    return data.results;
  };

  const client: QoreClient = {
    tables: () =>
      config.schema.tables.map(table => ({
        name: table.name,
        columns: table.columns
      })),
    views: () =>
      config.schema.tables.flatMap(table =>
        table.views.map(view => ({
          name: view.name,
          columns: table.columns.filter(column =>
            view.query
              ? ((view.query.fields as string[]) ?? []).includes(column.name)
              : true
          )
        }))
      ),
    insights: () =>
      config.schema.tables.flatMap(table =>
        table.insights.map(insight => ({
          name: insight.name,
          columns: insight.columns
        }))
      ),
    queries: () =>
      config.schema.queries?.map(query => ({
        name: query.name!,
        columns: query.columns!,
        params: query.params!
      })) ?? [],

    execute: async builderFn => {
      const transactionResult = transaction(builderFn);
      const result = execute(transactionResult.transactions);
      if (typeof transactionResult.returns === "string") {
        return result[transactionResult.returns];
      } else {
        return fromEntries(
          keys(transactionResult.returns).map(key => [
            key,
            result[transactionResult.returns[key]]
          ])
        );
      }
    },

    table: table => {
      const toExecutable = <
        T extends TableQueryBuilder,
        R = Record<string, any>
      >(
        queryBuilder: T
      ): TableQueryBuilderMapper<T, R> => {
        const { build, instruction, ...rest } = queryBuilder;
        return {
          ...fromEntries(
            keys(rest).map(key => [
              key,
              (...args) => toExecutable(rest[key](...args))
            ])
          ),
          exec: () => execute([build()]).then(results => results["data"])
        } as TableQueryBuilderMapper<T, R>;
      };
      const tableQueryBuilder: ClientTable = {
        select: fields => toExecutable(select(table, fields)),
        insert: data => toExecutable(insert(table, data)),
        update: data => toExecutable(update(table, data)),
        delete: () => toExecutable(del(table)),

        rows: async options => {
          const { data } = await execute([
            {
              operation: "Select",
              instruction: {
                ...options,
                table: table,
                name: "data"
              }
            }
          ]);
          return data;
        },
        action: async (column, rowId, params) => {
          const { data } = await axiosClient.post(
            `/v1/action/${table}/${column}/${rowId}`,
            { args: params },
            {
              headers: {
                accept: "application/json, text/plain, */*"
              }
            }
          );
          return data.result;
        }
      };
      return tableQueryBuilder;
    },

    view: view => {
      const viewQueryBuilder: ClientView = {
        rows: async options => {
          const { data } = await execute([
            {
              operation: "Select",
              instruction: {
                ...options,
                view: view,
                name: "data"
              }
            }
          ]);
          return data;
        }
      };
      return viewQueryBuilder;
    }
  };

  return client;
};

type ConnectConfig = {
  adminSecret?: string;
  token?: string;
};

export const connect = async (url: string, config: ConnectConfig = {}) => {
  const { data } = await axios.get("/v1/schema");
  return createClient({
    url,
    schema: data,
    ...config
  });
};
