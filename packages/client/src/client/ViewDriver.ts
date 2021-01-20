import { AxiosRequestConfig } from "axios";
import { nanoid } from "nanoid";
import { APIField } from "@feedloop/qore-sdk";
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
import { ConditionalPick, ConditionalExcept } from "type-fest";

export class ViewDriver<T extends QoreViewSchema = QoreViewSchema> {
  id: string;
  tableId: string;
  fields: Record<string, APIField> = {};
  project: QoreProject;
  client: QoreClient;
  actions: RowActions<T["actions"]>;
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
    this.actions = Object.entries(this.fields)
      .filter(([_, field]) => field.type === "action")
      .reduce(
        (prev, [fieldId]): RowActions<T["actions"]> => ({
          ...prev,
          [fieldId]: {
            trigger: async (rowId, params) => {
              const axiosConfig: AxiosRequestConfig = {
                url: `/${this.id}/rows/${rowId}/${fieldId}`,
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
          }
        }),
        {} as RowActions<T["actions"]>
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
      url: `/${this.id}/rows`,
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
      url: `/${this.id}/rows/${id}`,
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
  async updateRow(
    id: string,
    input: Partial<ConditionalExcept<T["write"], string[]>>
  ): Promise<T["read"]> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/${this.id}/rows/${id}`,
      data: input,
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
    const { error: patchError } = await this.client
      .execute(operation)
      .toPromise();
    if (patchError) throw patchError;
    const row = await this.readRow(id).toPromise();
    if (!row.data) throw row.error;
    return row.data;
  }
  async deleteRow(id: string): Promise<boolean> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/${this.id}/rows/${id}`,
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
  async insertRow(
    input: Partial<ConditionalExcept<T["write"], string[]>>
  ): Promise<T["read"]> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/${this.id}/rows`,
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

  async addRelation(
    rowId: string,
    relations: Partial<ConditionalPick<T["write"], string[]>>
  ): Promise<boolean> {
    await Promise.all(
      Object.entries(relations).flatMap(([field, values]) => {
        return (values as string[]).map(value => {
          const axiosConfig: AxiosRequestConfig = {
            baseURL: this.project.config.endpoint,
            url: `/orgs/${this.project.config.organizationId}/projects/${this.project.config.projectId}/tables/${this.tableId}/rows/${rowId}/relation/${field}`,
            method: "POST",
            data: { value }
          };
          return this.project.axios(axiosConfig);
        });
      })
    );
    return true;
  }

  async removeRelation(
    rowId: string,
    relations: Partial<ConditionalPick<T["write"], string[]>>
  ): Promise<boolean> {
    await Promise.all(
      Object.entries(relations).map(([field, relationId]) => {
        const axiosConfig: AxiosRequestConfig = {
          baseURL: this.project.config.endpoint,
          url: `/orgs/${this.project.config.organizationId}/projects/${this.project.config.projectId}/tables/${this.tableId}/rows/${rowId}/relation/${field}/${relationId}`,
          method: "DELETE"
        };
        return this.project.axios(axiosConfig);
      })
    );
    return true;
  }

  private async generateFileUrl(filename: string): Promise<string> {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/orgs/${this.project.config.organizationId}/projects/${this.project.config.projectId}/tables/${this.tableId}/upload-url?fileName=${filename}`,
      method: "GET"
    };
    const result = await this.project.axios(axiosConfig);
    return result.data.url;
  }
  async upload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const [ext] = file.name.split(".").reverse();
    const uploadUrl = await this.generateFileUrl(`${nanoid()}.${ext}`);
    const axiosConfig: AxiosRequestConfig = {
      url: uploadUrl,
      method: "PUT",
      data: formData
    };
    await this.project.axios(axiosConfig);
    const [url] = uploadUrl.split("?");
    return url;
  }
}
