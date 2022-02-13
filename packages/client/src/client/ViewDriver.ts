import Axios, { AxiosRequestConfig } from "axios";
import { nanoid } from "nanoid";
import {
  FormDrivers,
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

export class FormDriver<T extends QoreViewSchema["forms"][string]> {
  project: QoreProject;
  viewId: string;
  formId: string;
  constructor(project: QoreProject, viewId: string, formId: string) {
    this.project = project;
    this.viewId = viewId;
    this.formId = formId;
  }
  async sendForm(params: T): Promise<{ id: string }> {
    const resp = await this.project.axios.post<{ id: string }>(
      `/${this.viewId}/forms/${this.formId}`,
      params
    );
    return resp.data;
  }
}

export class ViewDriver<T extends QoreViewSchema = QoreViewSchema> {
  id: string;
  tableId: string;
  fields: Record<string, any> = {};
  project: QoreProject;
  client: QoreClient;
  actions: RowActions<T["actions"]>;
  forms: FormDrivers<T["forms"]>;
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
    // @ts-ignore
    this.forms = {};
    this.fields = fields.reduce(
      (map, field) => ({ ...map, [field.id]: field }),
      {}
    );
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
  form<K extends keyof FormDrivers<T["forms"]>>(
    formId: K
  ): FormDriver<T["forms"][K]> {
    if (!this.forms[formId]) {
      this.forms[formId] = new FormDriver<T["forms"][K]>(
        this.project,
        this.id,
        formId as string
      );
    }
    return this.forms[formId];
  }
  readRows(
    opts: Partial<{
      offset: number;
      limit: number;
      order: "asc" | "desc";
      populate: Array<string>;
    }> &
      T["params"] = {},
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<
    QoreOperationResult<AxiosRequestConfig, { nodes: T["read"][] }>
  > & { fetchMore: (fetchMoreOptions: typeof opts) => Promise<void> } {
    const axiosConfig: AxiosRequestConfig = {
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Select",
            instruction: {
              table: this.id,
              name: "data",
              populate: opts.populate,
              limit: opts.limit,
              offset: opts.offset,
              orderBy: { id: opts.order?.toUpperCase() }
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
      ...{ ...defaultOperationConfig, ...config }
    };
    const stream = this.client.execute(operation);
    const mappedStream = pipe(
      stream,
      map(result => ({
        ...result,
        data: { nodes: result.data?.results.data || [] }
      }))
    ) as PromisifiedSource<
      QoreOperationResult<AxiosRequestConfig, { nodes: T["read"][] }>
    > & { fetchMore: (fetchMoreOptions: typeof opts) => Promise<void> };
    mappedStream.fetchMore = async fetchMoreOpts => {
      const existingItems = await stream.revalidate({
        networkPolicy: "cache-only"
      });
      const moreItems = await this.readRows(fetchMoreOpts, config).toPromise();
      await stream.revalidate({
        networkPolicy: "cache-only",
        optimisticResponse: {
          nodes: [
            ...(existingItems.data?.nodes || []),
            ...(moreItems.data?.nodes || [])
          ]
        }
      });
    };
    return mappedStream;
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
              table: this.id,
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
      ...{ ...defaultOperationConfig, ...config }
    };
    return this.client.execute(operation);
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
              table: this.id,
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
      },
      headers: { Sync: config.mode === "sync" ? "true" : undefined }
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
              table: this.id,
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
      },
      headers: { Sync: config.mode === "sync" ? "true" : undefined }
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
              table: this.id,
              name: "data",
              data: input
            }
          }
        ]
      },
      method: "POST",
      headers: { Sync: config.mode === "sync" ? "true" : undefined }
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
          table: this.id,
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
          table: this.id,
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

  private async generateFileUrl(filename: string): Promise<string> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/${this.project.config.projectId}/${this.id}/upload-url?fileName=${filename}`,
      method: "GET"
    };
    const result = await this.project.axios(axiosConfig);
    return result.data.url;
  }
  async upload(file: File): Promise<string> {
    const [ext] = file.name.split(".").reverse();
    const uploadUrl = await this.generateFileUrl(`${nanoid()}.${ext}`);
    await Axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type
      }
    });
    const [url] = uploadUrl.split("?");
    return url;
  }
}
