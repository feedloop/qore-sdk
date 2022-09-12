import Axios, { AxiosRequestConfig } from "axios";
import {
  QoreOperation,
  QoreOperationConfig,
  QoreOperationResult,
  QoreViewSchema,
  RowActions
} from "../types";
import QoreClient, {
  QoreProject,
  PromisifiedSource,
  defaultOperationConfig
} from "./Qore";
import { ConditionalPick, ConditionalExcept } from "type-fest";
import { map, pipe } from "wonka";

export class ViewDriver<T extends QoreViewSchema = QoreViewSchema> {
  id: string;
  tableId: string;
  fields: Record<string, any> = {};
  project: QoreProject;
  client: QoreClient;
  actions: RowActions<T["actions"]>;
  isTable: boolean = false;
  constructor(
    client: QoreClient,
    project: QoreProject,
    id: string,
    tableId: string,
    fields: any[]
  ) {
    this.client = client;
    this.id = id;
    this.tableId = tableId;
    this.project = project;
    this.fields = fields.reduce(
      (map, field) => ({ ...map, [field.id]: field }),
      {}
    );
    this.isTable = id === tableId;
    this.actions = new Proxy({} as RowActions<T["actions"]>, {
      get: (actions, key: string): RowActions<T["actions"]>[string] => {
        if (!actions[key]) {
          // @ts-ignore
          actions[key] = this.createAction(key);
        }
        return actions[key];
      }
    });
    for (const [key] of Object.entries(this.fields).filter(
      ([_, field]) => field.type === "action"
    )) {
      // @ts-ignore
      this.actions[key] = this.createAction(key);
    }
  }
  action(
    actionId: keyof RowActions<T["actions"]>
  ): RowActions<T["actions"]>[typeof actionId] {
    if (!this.actions[actionId]) {
      // @ts-ignore
      this.actions[actionId] = this.createAction(actionId as string);
    }
    return this.actions[actionId];
  }
  createAction<FieldID = string>(
    fieldID: FieldID
  ): RowActions<T["actions"]>[string] {
    return {
      trigger: async (rowId, params) => {
        const axiosConfig: AxiosRequestConfig = {
          url: `/${this.id}/rows/${rowId}/${fieldID}`,
          data: params,
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
        const res = await this.client
          .execute<{ isExecuted: false }>(operation)
          .toPromise();
        if (res.data?.isExecuted) return true;
        if (res.error) throw res.error;
        throw new Error("Trigger has failed");
      }
    };
  }

  readRows(
    opts: Partial<{
      offset: number;
      limit: number;
      order: "asc" | "desc";
      orderBy: Record<string, "ASC" | "DESC">;
      populate: Array<string>;
      condition: Record<string, any>;
    }> &
      T["params"] = {},
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<QoreOperationResult<AxiosRequestConfig, T["read"][]>> & {
    fetchMore: (fetchMoreOptions: typeof opts) => Promise<void>;
  } {
    const axiosConfig: AxiosRequestConfig = {
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Select",
            instruction: {
              [this.isTable ? "table" : "view"]: this.id,
              name: "data",
              populate: opts.populate,
              limit: opts.limit,
              offset: opts.offset,
              orderBy: opts.orderBy || {},
              condition: opts.condition || { $and: [] },
              params: opts.params || {}
            }
          }
        ]
      }
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      mode: "subscription",
      ...{ ...defaultOperationConfig, ...config }
    };
    const stream = this.client.execute(operation, resultStream =>
      pipe(
        resultStream,
        map(result => ({
          ...result,
          data: result.data?.results.data || []
        }))
      )
    ) as PromisifiedSource<
      QoreOperationResult<AxiosRequestConfig, T["read"][]>
    > & { fetchMore: (fetchMoreOptions: typeof opts) => Promise<void> };

    stream.fetchMore = async fetchMoreOpts => {
      const existingItems = await stream.revalidate({
        networkPolicy: "cache-only"
      });
      const moreItems = await this.readRows(fetchMoreOpts, config).toPromise();
      await stream.revalidate({
        networkPolicy: "network-only",
        optimisticResponse: [
          ...(existingItems.data || []),
          ...(moreItems.data || [])
        ]
      });
    };
    return stream;
  }

  readRow(
    id: string,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<QoreOperationResult<AxiosRequestConfig, T["read"]>> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Select",
            instruction: {
              [this.isTable ? "table" : "view"]: this.id,
              name: "data",
              condition: {
                $and: [
                  {
                    id: {
                      $eq: id
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      mode: "subscription",
      ...{ ...defaultOperationConfig, ...config }
    };
    const stream = this.client.execute(operation, resultStream =>
      pipe(
        resultStream,
        map(result => {
          const row = result.data?.results?.data?.[0];
          return {
            ...result,
            // @ts-ignore
            data:
              row &&
              Object.fromEntries(
                Object.entries(row).map(([key, val]) => [
                  key,
                  val && typeof val === "object" && "filename" in val
                    ? `${this.project.config.endpoint}/v1/files/public/${
                        this.id
                      }/${id}/${key}/${
                        // @ts-ignore
                        val.filename
                      }`
                    : val
                ])
              )
          };
        })
      )
    ) as PromisifiedSource<QoreOperationResult<AxiosRequestConfig, T["read"]>>;
    return stream;
  }
  async updateRow(
    id: string,
    input: Partial<ConditionalExcept<T["write"], string[]>>,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): Promise<T["read"]> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Update",
            instruction: {
              [this.isTable ? "table" : "view"]: this.id,
              name: "data",
              condition: {
                $and: [
                  {
                    id: {
                      $eq: id
                    }
                  }
                ]
              },
              set: input
            }
          }
        ]
      }
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      pollInterval: 0,
      networkPolicy: "network-only"
    };
    const { data, error: patchError } = await this.client
      .execute(operation)
      .toPromise();
    if (patchError) throw patchError;
    const row = await this.readRow(id).toPromise();
    if (!row.data) throw row.error;
    return row.data;
  }
  async deleteRow(
    id: string,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): Promise<boolean> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Delete",
            instruction: {
              [this.isTable ? "table" : "view"]: this.id,
              name: "data",
              condition: {
                $and: [
                  {
                    id: {
                      $eq: id
                    }
                  }
                ]
              }
            }
          }
        ]
      }
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
  async insertRow(
    input: Partial<ConditionalExcept<T["write"], string[]>>,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): Promise<T["read"]> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      data: {
        operations: [
          {
            operation: "Insert",
            instruction: {
              [this.isTable ? "table" : "view"]: this.id,
              name: "data",
              data: input
            }
          }
        ]
      },
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
    const result = await this.client.execute(operation).toPromise();
    if (!result.data) throw result.error;
    return result.data;
  }

  async addRelation(
    rowId: string,
    relations: Partial<ConditionalPick<T["write"], string[]>>
  ): Promise<boolean> {
    const operations = Object.entries(relations).flatMap(([field, refs]) => {
      return (refs as string[]).map(ref => ({
        operation: "AddRelation",
        instruction: {
          [this.isTable ? "table" : "view"]: this.id,
          name: `addRelation_${field}_${ref}`,
          relation: {
            name: field,
            data: {
              origin: rowId,
              target: ref
            }
          }
        }
      }));
    });
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations
      }
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

  async removeRelation(
    rowId: string,
    relations: Partial<ConditionalPick<T["write"], string[]>>
  ): Promise<boolean> {
    const operations = Object.entries(relations).flatMap(([field, refs]) => {
      return (refs as string[]).map(ref => ({
        operation: "RemoveRelation",
        instruction: {
          [this.isTable ? "table" : "view"]: this.id,
          name: `addRelation_${field}_${ref}`,
          relation: {
            name: field,
            data: {
              origin: rowId,
              target: ref
            }
          }
        }
      }));
    });
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations
      }
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

  private async generateUploadToken(
    rowId: string,
    column: string
  ): Promise<string> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/v1/files/token/table/${this.id}/id/${rowId}/column/${column}?access=write`,
      method: "GET"
    };
    const result = await this.project.axios(axiosConfig);
    return result.data.token;
  }
  async upload(rowId: string, column: string, file: File): Promise<string> {
    const uploadToken = await this.generateUploadToken(rowId, column);
    const formData = new FormData();
    formData.append("file", file);
    const response = await Axios.post(
      `/v1/files/upload?token=${uploadToken}`,
      formData,
      {
        baseURL: this.project.config.endpoint,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return `${this.project.config.endpoint}/v1/files/public/${this.id}/${rowId}/${column}/${response.data.filename}`;
  }
}
