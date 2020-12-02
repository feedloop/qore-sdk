import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import produce from "immer";
import { schema, Schema, SchemaObject } from "normalizr";
import { Field } from "../sdk/project/field";

type RelationValue = { id: string } | Array<{ id: string }>;

type QoreRow = { id: string } & Record<
  string,
  string | number | boolean | RelationValue
>;

type QoreConfig = {
  projectId: string;
  organisationId: string;
};

class QoreProject {
  config: QoreConfig;
  axios: AxiosInstance;
  cache = new NormalizedCache();
  constructor(config: QoreConfig) {
    this.config = config;
    this.axios = Axios.create({
      baseURL: `${process.env.QORE_API || ""}/orgs/${
        this.config.organisationId
      }/projects/${this.config.projectId}`,
    });
    this.axios.interceptors.response.use(
      async function handleSuccess(resp) {
        return resp;
      },
      async function handleError(error) {
        throw error;
      }
    );
  }
}

type CacheConfig = {
  mode: "network" | "cache";
};

const defaultCacheConfig: CacheConfig = { mode: "cache" };

class ViewDriver<T extends QoreRow = QoreRow> {
  id: string;
  tableId: string;
  fields: Record<string, Field> = {};
  project: QoreProject;
  cache = new Map<string, T | T[]>();
  constructor(
    project: QoreProject,
    id: string,
    tableId: string,
    fields: Field[]
  ) {
    this.id = id;
    this.tableId = tableId;
    this.project = project;
    this.fields = fields.reduce(
      (map, field) => ({ ...map, [field.id]: field }),
      {}
    );
  }
  async readRows(
    opts: { offset?: number; limit?: number } = {},
    config: CacheConfig = defaultCacheConfig
  ): Promise<T[]> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/views/${this.id}/v2rows`,
      params: opts,
    };
    const key = `${this.id}:opts:${JSON.stringify(opts)}`;
    const cached = this.cache.get(key);
    if (Array.isArray(cached) && config.mode === "cache") return cached;
    const resp = await this.project.axios.request<{ nodes: T[] }>(axiosConfig);
    this.cache.set(key, resp.data.nodes);
    return this.readRows(opts, defaultCacheConfig);
  }
  async readRow(
    id: string,
    config: CacheConfig = defaultCacheConfig
  ): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      url: `/views/${this.id}/v2rows/${id}`,
    };
    const key = `${this.id}:id:${id}`;
    const cached = this.cache.get(key);
    if (
      typeof cached === "object" &&
      !Array.isArray(cached) &&
      config.mode === "cache"
    )
      return cached;
    const resp = await this.project.axios.request<T>(axiosConfig);
    this.cache.set(key, resp.data);
    return this.readRow(id, defaultCacheConfig);
  }
  async updateRow(id: string, input: Partial<T>): Promise<T> {
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
          [key]: Array.isArray(value) ? value.map((val) => val.id) : value.id,
        };
      });
    await this.project.axios.patch<{ ok: boolean }>(
      `/tables/${this.tableId}/rows/${id}`,
      { ...nonRelational, ...relational }
    );
    const row = await this.readRow(id);
    return row;
  }
  async deleteRow(id: string): Promise<boolean> {
    const key = `${this.id}:id:${id}`;
    const resp = await this.project.axios.delete<{ ok: boolean }>(
      `/tables/${this.tableId}/rows/${id}`
    );
    this.cache.delete(key);
    return resp.data.ok;
  }
  async insertRow(input: Omit<Partial<T>, "id">): Promise<T> {
    const resp = await this.project.axios.post<{ id: string }>(
      `/tables/${this.tableId}/rows`,
      input
    );
    const row = await this.readRow(resp.data.id);
    return row;
  }
  async addRelation(
    id: string,
    relation: string,
    target: string
  ): Promise<boolean> {
    const resp = await this.project.axios.post<{ ok: true }>(
      `/tables/${this.tableId}/rows/${id}/relation/${relation}`,
      { value: target }
    );
    return resp.data.ok;
  }
}

type ViewDriverObject<T> = T extends ViewDriver<infer U> ? U : never;

type CacheRef = { __ref: string };

// for future reference if normalized cache is necessary
class NormalizedCache {
  data: Record<
    string,
    Record<string, boolean | number | string | CacheRef>
  > = {};
  modify(modifier: (data: NormalizedCache["data"]) => void) {
    this.data = produce(this.data, modifier);
  }
  identify(table: string, id: string) {
    return `${table}:${id}`;
  }
  lookup(ref: CacheRef, depth = 0): Record<string, any> {
    const record: Record<string, any> = {};
    const [table, id] = ref.__ref.split(":");
    const cacheKey = this.identify(table, id);
    const cache = this.data[cacheKey];
    for (const [key, value] of Object.entries(cache)) {
      record[key] =
        typeof value !== "object"
          ? value
          : depth > 0
          ? this.lookup(value, depth - 1)
          : undefined;
    }
    return record;
  }
  read<V extends ViewDriver>(view: V, id: string): ViewDriverObject<V> {
    return this.lookup(
      { __ref: this.identify(view.tableId, id) },
      1
    ) as ViewDriverObject<V>;
  }
  write<V extends ViewDriver, T extends QoreRow>(view: V, rows: T[]) {
    for (const row of rows) {
      const id = this.identify(view.tableId, row.id);
      for (const field of Object.values(view.fields)) {
        if (typeof row === "object") return;
        this.modify((draft) => {
          draft[id][field.id] = row[field.id];
        });
      }
    }
  }
}

export default class QoreClient<T extends Record<string, any>> {
  project: QoreProject;
  // @ts-ignore
  views: { [K in keyof T]: ViewDriver<T[K]> } = {};
  constructor(config: QoreConfig) {
    this.project = new QoreProject(config);
  }
  async init() {
    const resp = await this.project.axios.get<{
      nodes: Array<{ id: string; name: string; tableId: string }>;
    }>("/views");
    const views = await Promise.all(
      resp.data.nodes.map(async (view) => {
        const resp = await this.project.axios.get<{ nodes: Field[] }>(
          `/views/${view.id}/fields`
        );
        return new ViewDriver(
          this.project,
          view.id,
          view.tableId,
          resp.data.nodes
        );
      })
    );
    // @ts-ignore
    this.views = views.reduce(
      (map, driver) => ({
        ...map,
        [driver.id]: driver,
      }),
      {}
    );
  }
}
