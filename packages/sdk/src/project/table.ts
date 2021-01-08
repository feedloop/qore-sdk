import { callApi } from "../common";
import { ProjectConfig } from "./project";
import { APIRow, Row, Rows, RowImpl } from "./row";
import {
  APIView,
  APIViewSummary,
  View,
  ViewImpl,
  ViewSummary,
  ViewSummaryImpl
} from "./view";
import { url } from "./url";
import { APIField, buildField, Field, FieldType } from "./field/field";
import {
  APIForm,
  APIFormSummary,
  Form,
  FormImpl,
  FormSummary,
  FormSummaryImpl
} from "./form";

export type APITable = {
  id: string;
  name: string;
  type: "auth" | "cross-project" | null;
  master?: {
    projectId: string;
    tableId: string;
  };
};

export interface Table extends APITable {
  _config: ProjectConfig;
  id: string;
  name: string;
  createView(
    params: Omit<APIView, "id" | "vields"> & { vields: string[] }
  ): Promise<string>;
  views(): Promise<ViewSummary[]>;
  view(id: string): Promise<View>;
  createForm(params: Omit<APIForm, "id">): Promise<string>;
  forms(): Promise<FormSummary[]>;
  form(id: string): Promise<Form>;
  addField<T extends FieldType = FieldType>(
    field: Omit<APIField<T>, "id"> & { viewId?: string }
  ): Promise<string>;
  fields(): Promise<Field[]>;
  field(id: string): Promise<Field>;
  rowsCount(qs: {
    [key: string]: any;
    limit?: number;
    offset?: number;
    isDisplayField?: boolean;
  }): Promise<{ totalCount: number }>;
  rows(qs: {
    [key: string]: any;
    limit?: number;
    offset?: number;
    isDisplayField?: boolean;
  }): Promise<Rows>;
  row(rowId: string): Promise<Row>;
  addRow(params?: { [key: string]: any }): Promise<string>;
  delete(): Promise<void>;
  update(table: Partial<Omit<APITable, "id">>): Promise<void>;
}

export class TableImpl implements Table {
  id: string;
  name: APITable["name"];
  type: APITable["type"];
  _config: ProjectConfig;
  constructor(params: APITable & { config: ProjectConfig }) {
    this.id = params.id;
    this.name = params.name;
    this.type = params.type;
    this._config = params.config;
  }
  async views(limit?: number, offset?: number): Promise<ViewSummary[]> {
    const { nodes } = await callApi<Rows<APIViewSummary>>(
      {
        method: "get",
        url: url.view(this._config),
        params: { limit, offset, tableId: this.id }
      },
      this._config.token
    );
    return nodes.map(
      view => new ViewSummaryImpl({ ...view, config: this._config })
    );
  }
  async view(viewId: string): Promise<View> {
    const view = await callApi<APIView>(
      {
        method: "get",
        url: url.view({ ...this._config, viewId })
      },
      this._config.token
    );
    return new ViewImpl({ ...view, config: this._config });
  }
  async createView(
    params: Omit<APIView, "id" | "vields"> & { vields: string[] }
  ): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: url.view(this._config),
        data: params
      },
      this._config.token
    );
    return id;
  }
  async forms(limit?: number, offset?: number): Promise<FormSummary[]> {
    const { nodes } = await callApi<Rows<APIFormSummary>>(
      {
        method: "get",
        url: url.form(this._config),
        params: { limit, offset, tableId: this.id }
      },
      this._config.token
    );
    return nodes.map(
      form => new FormSummaryImpl({ ...form, config: this._config })
    );
  }
  async form(formId: string): Promise<Form> {
    const form = await callApi<APIForm>(
      {
        method: "get",
        url: url.form({ ...this._config, formId })
      },
      this._config.token
    );
    return new FormImpl({ ...form, config: this._config });
  }
  async createForm(params: Omit<APIForm, "id">): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: url.form(this._config),
        data: params
      },
      this._config.token
    );
    return id;
  }
  async addField<T extends FieldType = FieldType>(
    field: Omit<APIField<T>, "id"> & { viewId?: string }
  ): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: url.field({ ...this._config, tableId: this.id }),
        data: field
      },
      this._config.token
    );
    return id;
  }
  async fields(): Promise<Field[]> {
    const { nodes } = await callApi<Rows<APIField>>(
      {
        method: "get",
        url: url.field({ ...this._config, tableId: this.id })
      },
      this._config.token
    );
    return nodes.map(field =>
      buildField({ field, tableId: this.id, config: this._config })
    );
  }
  async field(fieldId: string): Promise<Field> {
    const field = await callApi<APIField>(
      {
        method: "get",
        url: url.field({ ...this._config, tableId: this.id, fieldId })
      },
      this._config.token
    );
    if (!field) throw new Error("Field not found");
    return buildField({ field, tableId: this.id, config: this._config });
  }
  async rowsCount(
    qs: {
      [key: string]: any;
      limit?: number;
      offset?: number;
      isDisplayField?: boolean;
    } = {}
  ): Promise<{ totalCount: number }> {
    const { totalCount } = await callApi(
      {
        method: "get",
        url: url.vrowCount({ ...this._config, viewId: this.id }),
        params: qs
      },
      this._config.token
    );
    return { totalCount };
  }
  async rows(
    qs: {
      [key: string]: any;
      limit?: number;
      offset?: number;
      isDisplayField?: boolean;
    } = {}
  ): Promise<Rows> {
    const { nodes, totalCount } = await callApi(
      {
        method: "get",
        url: url.row({ ...this._config, tableId: this.id }),
        params: qs
      },
      this._config.token
    );
    const params = { config: this._config, parentId: this.id };
    return {
      nodes: nodes.map((row: APIRow) => new RowImpl(params, row)),
      totalCount
    };
  }
  async row(rowId: string): Promise<Row> {
    const row = await callApi<APIRow>(
      {
        method: "get",
        url: url.row({ ...this._config, tableId: this.id, rowId })
      },
      this._config.token
    );
    const params = { config: this._config, parentId: this.id };
    return new RowImpl(params, row);
  }
  async addRow(): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: url.row({ ...this._config, tableId: this.id })
      },
      this._config.token
    );
    return id;
  }
  async update(table: Partial<Omit<APITable, "id">>): Promise<void> {
    await callApi(
      {
        method: "patch",
        url: url.row({ ...this._config, tableId: this.id }),
        data: table
      },
      this._config.token
    );
  }
  async delete(): Promise<void> {
    await callApi(
      {
        method: "delete",
        url: url.table({ ...this._config, tableId: this.id })
      },
      this._config.token
    );
  }
}
