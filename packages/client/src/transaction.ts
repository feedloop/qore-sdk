import { ToString } from "./condition";
import {
  Operation,
  TableQueryBuilder,
  SelectTableQueryBuilder,
  InsertTableQueryBuilder,
  UpdateTableQueryBuilder,
  DeleteTableQueryBuilder,
  select,
  insert,
  update,
  del
} from "./operation";

type TableTransactionBuilderMapper<B extends TableQueryBuilder> = {
  [key in keyof B]: key extends "build"
    ? B["build"]
    : (
        // @ts-ignore -- idk
        ...args: Parameters<B[key]>
      ) => TableTransactionBuilder & ToString & TransactionGetter;
} &
  ToString &
  TransactionGetter;

export type SelectTableTransactionBuilder = TableTransactionBuilderMapper<SelectTableQueryBuilder>;
export type InsertTableTransactionBuilder = TableTransactionBuilderMapper<InsertTableQueryBuilder>;
export type UpdateTableTransactionBuilder = TableTransactionBuilderMapper<UpdateTableQueryBuilder>;
export type DeleteTableTransactionBuilder = TableTransactionBuilderMapper<DeleteTableQueryBuilder>;
export type TableTransactionBuilder =
  | SelectTableTransactionBuilder
  | InsertTableTransactionBuilder
  | UpdateTableTransactionBuilder
  | DeleteTableTransactionBuilder;

type DynamicGetter = {
  [key in string]: (() => string) & DynamicGetter;
};

type TransactionGetter = {
  result: DynamicGetter;
};

type QoreTransactionTable = {
  select: (fields?: "*" | string[]) => SelectTableTransactionBuilder;
  insert: (data: Record<string, any>) => InsertTableTransactionBuilder;
  update: (data: Record<string, any>) => UpdateTableTransactionBuilder;
  delete: () => DeleteTableTransactionBuilder;
};

type TransactionResult = {
  transactions: Operation[];
  returns: string | Record<string, string>;
};

type TransactionItemBuilder = {
  [key in string]: QoreTransactionTable;
};

export type TransactionBuilder = (
  builderFn: (
    builder: TransactionItemBuilder
  ) => TableTransactionBuilder | Record<string, TableTransactionBuilder>
) => TransactionResult;

const createDynamicGetter = (property: string): DynamicGetter => {
  const getter: DynamicGetter = new Proxy(() => {}, {
    get: (target: any, key: string) => {
      return isNaN(parseInt(key))
        ? createDynamicGetter(`${property}.${key}`)
        : createDynamicGetter(`${property}[${key}]`);
    },
    apply: (target: any, thisArg: any, argArray?: any) => {
      return property;
    }
  });
  return getter;
};

export const transaction: TransactionBuilder = builderFn => {
  const transactionTables: TableTransactionBuilder[] = [];
  const toTransactionItem = <T extends TableQueryBuilder>(
    builder: T,
    operation?: string
  ): TableTransactionBuilderMapper<T> => {
    const operationName = operation ?? `operation${transactionTables.length}`;
    const transactionItem = (() =>
      operationName) as TableTransactionBuilderMapper<T>;
    transactionItem.result = createDynamicGetter(operationName);
    Object.keys(builder).forEach(key => {
      if (typeof builder[key] !== "function") return;
      const method = builder[key]?.bind(builder);
      transactionItem[key] =
        key === "build"
          ? method
          : (...args: any) => toTransactionItem(method(...args), operationName);
    });
    if (!operation) {
      transactionTables.push(transactionItem as TableTransactionBuilder);
    }
    return transactionItem;
  };

  const builder: TransactionItemBuilder = new Proxy(
    {},
    {
      get: (target: any, tableName: string) => {
        const builder: QoreTransactionTable = {
          select: (fields = "*") => {
            return toTransactionItem(select(tableName, fields));
          },
          insert: data => {
            return toTransactionItem(insert(tableName, data));
          },
          update: data => {
            return toTransactionItem(update(tableName, data));
          },
          delete: () => {
            return toTransactionItem(del(tableName));
          }
        };
        return builder;
      }
    }
  );

  const result = builderFn(builder) as
    | TableTransactionBuilder
    | Record<string, TableTransactionBuilder>;
  const transactions = transactionTables.map(builder => {
    const operation = builder.build();
    return {
      ...operation,
      instruction: {
        ...operation.instruction,
        name: builder()
      }
    } as Operation;
  });
  const returns =
    typeof result === "function"
      ? result()
      : (Object.fromEntries(
          Object.entries(result).map(([key, value]) => [key, value()])
        ) as Record<string, string>);
  return {
    transactions,
    returns
  };
};
