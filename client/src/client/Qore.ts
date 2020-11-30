import Axios, { AxiosInstance } from "axios";
import produce from "immer";
import { Field } from "../sdk/project/field";

type RelationValue = { id: string } | Array<{ id: string }>;

type QoreRow = { id: string } & Record<
  string,
  string | number | boolean | RelationValue
>;

class Storage {
  data: Record<string, any> = {};
  modify(modifier: (draft: Record<string, any>) => void) {
    this.data = produce(this.data, modifier);
  }
  reset() {
    this.data = {};
  }
}

type QoreConfig = {
  projectId: string;
  organisationId: string;
};

class QoreProject {
  config: QoreConfig;
  axios: AxiosInstance;
  storage = new Storage();
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

class ViewDriver<T extends QoreRow = QoreRow> {
  id: string;
  tableId: string;
  fields: Record<string, Field> = {};
  project: QoreProject;
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
  async readRows(opts: { offset?: number; limit?: number } = {}): Promise<T[]> {
    const resp = await this.project.axios.get<{ nodes: T[] }>(
      `/views/${this.id}/v2rows`, {params: opts}
    );
    return resp.data.nodes;
  }
  async readRow(id: string): Promise<T> {
    const resp = await this.project.axios.get<T>(
      `/views/${this.id}/v2rows/${id}`
    );
    return resp.data;
  }
  async updateRow(id: string, input: Partial<T>): Promise<T> {
    const inputs = Object.entries(input);
    const nonRelational = inputs
      .filter(([key]) => {
        return this.fields[key].type !== "relation";
      })
      .reduce(
        (obj, [key, value]): Record<string, any> => ({ ...obj, [key]: value }), {}
      );
    const relational = inputs
      .filter(([key]) => {
        const fieldDef = this.fields[key];
        return fieldDef.type === "relation";
      })
      .reduce(
        (acc, [key, value]: [string, RelationValue]) => {
          return {
            ...acc,
            [key]: Array.isArray(value) ? value.map((val) => val.id) : value.id,
          };
        }
      );
    await this.project.axios.patch<{ ok: boolean }>(
      `/tables/${this.tableId}/rows/${id}`,
      { ...nonRelational, ...relational }
    );
    const row = await this.readRow(id);
    return row;
  }
  async deleteRow(id: string): Promise<boolean> {
    const resp = await this.project.axios.delete<{ ok: boolean }>(
      `/tables/${this.tableId}/rows/${id}`
    );
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
