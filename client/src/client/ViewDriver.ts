import { AxiosRequestConfig } from "axios";
import { APIField } from "../sdk/project/field";
import {
  QoreOperation,
  QoreOperationConfig,
  QoreOperationResult,
  QoreViewSchema,
  RowActions
} from "../types";
import QoreClient, {
  QoreProject,
  RelationValue,
  PromisifiedSource,
  defaultOperationConfig
} from "./Qore";

export class ViewDriver<T extends QoreViewSchema = QoreViewSchema> {
  id: string;
  tableId: string;
  fields: Record<string, APIField> = {};
  project: QoreProject;
  client: QoreClient;
  constructor(
    client: QoreClient,
    project: QoreProject,
    id: string,
    tableId: string,
    fields: APIField[]
  ) {
    this.client = client;
    this.id = id;
    this.tableId = tableId;
    this.project = project;
    this.fields = fields.reduce(
      (map, field) => ({ ...map, [field.id]: field }),
      {}
    );
  }
  readRows(
    opts: Partial<{ offset: number; limit: number; order: "asc" | "desc" }> &
      T["params"] = {},
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<
    QoreOperationResult<AxiosRequestConfig, { nodes: T["read"][] }>
  > {
    const axiosConfig: AxiosRequestConfig = {
      url: `/views/${this.id}/v2rows`,
      params: opts,
      method: "GET"
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      ...{ ...defaultOperationConfig, ...config }
    };
    return this.client.execute(operation);
  }

  readRow(
    id: string,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<QoreOperationResult<AxiosRequestConfig, T["read"]>> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/views/${this.id}/v2rows/${id}`,
      method: "GET"
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      ...{ ...defaultOperationConfig, ...config }
    };
    return this.client.execute(operation);
  }
  async updateRow(id: string, input: Partial<T["write"]>): Promise<T["read"]> {
    const inputs = Object.entries(input);
    const nonRelational = inputs
      .filter(([key]) => {
        return this.fields[key].type !== "relation";
      })
      .reduce(
        (obj, [key, value]): Record<string, any> => ({ ...obj, [key]: value }),
        {}
      );
    const relational = inputs
      .filter(([key]) => {
        const fieldDef = this.fields[key];
        return fieldDef.type === "relation";
      })
      .reduce((acc, [key, value]: [string, RelationValue]) => {
        return {
          ...acc,
          [key]: Array.isArray(value) ? value.map(val => val.id) : value.id
        };
      }, {});
    const axiosConfig: AxiosRequestConfig = {
      url: `/tables/${this.tableId}/rows/${id}`,
      data: { ...nonRelational, ...relational },
      method: "PATCH"
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      pollInterval: 0,
      networkPolicy: "network-only"
    };
    await this.client.execute(operation).toPromise();
    const row = await this.readRow(id).toPromise();
    if (!row.data) throw row.error;
    return row.data;
  }
  async deleteRow(id: string): Promise<boolean> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/tables/${this.tableId}/rows/${id}`,
      method: "DELETE"
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      pollInterval: 0,
      networkPolicy: "network-only"
    };
    const res = await this.client.execute(operation).toPromise();
    if (res.error) throw res.error;
    return true;
  }
  async insertRow(input: Partial<T["write"]>): Promise<T["read"]> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/tables/${this.tableId}/rows`,
      data: input,
      method: "POST"
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      pollInterval: 0,
      networkPolicy: "network-only"
    };
    const result = await this.client
      .execute<{ id: string }>(operation)
      .toPromise();
    if (!result.data?.id) throw result.error;
    const row = await this.readRow(result.data.id).toPromise();
    if (!row.data) throw row.error;
    return row.data;
  }

  rowActions(rowId: string): RowActions<T["actions"]> {
    return Object.entries(this.fields)
      .filter(([_, field]) => field.type === "action")
      .reduce(
        (prev, [fieldId]) => ({
          ...prev,
          [fieldId]: {
            trigger: async input => {
              const axiosConfig: AxiosRequestConfig = {
                url: `/tables/${this.tableId}/rows/${rowId}/action/${fieldId}`,
                data: input,
                method: "POST"
              };
              const operation: QoreOperation = {
                key: JSON.stringify(axiosConfig),
                request: axiosConfig,
                type: axiosConfig.method,
                meta: {},
                pollInterval: 0,
                networkPolicy: "network-only"
              };
              const res = await this.client.execute(operation).toPromise();
              if (res.error) throw res.error;
              return true;
            }
          }
        }),
        {} as RowActions<T["actions"]>
      );
  }
}
