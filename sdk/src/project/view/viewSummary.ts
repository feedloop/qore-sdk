import { callApi } from "../../common";
import { APIField, FieldType } from "../field";
import { ProjectConfig } from "../project";
import { APIRow, Row, RowImpl, Rows } from "../row";
import { APIView } from "./view";
import { ViewMethod } from "./viewMethod";
import { url } from "../url";

export type Vield<T extends FieldType = FieldType> = APIField<T> & {
  delete(): Promise<void>;
};

export type APIViewSummary = {
  id: string;
  name: string;
  tableId: string;
};

export type ViewSummary = APIViewSummary & ViewMethod;

export class ViewSummaryImpl implements ViewSummary {
  id: string;
  tableId: APIViewSummary["tableId"];
  name: APIViewSummary["name"];
  _config: ProjectConfig;
  constructor(params: APIViewSummary & { config: ProjectConfig }) {
    this.id = params.id;
    this.name = params.name;
    this.tableId = params.tableId;
    this._config = params.config;
  }
  async update(
    view: Omit<APIView, "id" | "vields"> & { vields: string[] }
  ): Promise<void> {
    await callApi(
      {
        method: "patch",
        url: url.view({ ...this._config, viewId: this.id }),
        data: view
      },
      this._config.token
    );
  }
  async addVield(fieldId: string): Promise<void> {
    await callApi(
      {
        method: "post",
        url: url.vield({ ...this._config, viewId: this.id, fieldId })
      },
      this._config.token
    );
  }
  async vields(): Promise<Vield[]> {
    const { nodes } = await callApi<Rows<APIField>>(
      {
        method: "get",
        url: url.vield({ ...this._config, viewId: this.id })
      },
      this._config.token
    );
    return nodes.map(field => ({
      ...field,
      delete: async (): Promise<void> => {
        await callApi(
          {
            method: "delete",
            url: url.vield({
              ...this._config,
              viewId: this.id,
              fieldId: field.id
            })
          },
          this._config.token
        );
      }
    }));
  }
  async reorderVieldAfter(fieldId: string, afterFieldId: string) {
    await callApi(
      {
        method: "patch",
        url: url.reorderVieldAfter({
          ...this._config,
          viewId: this.id,
          fieldId,
          afterFieldId
        })
      },
      this._config.token
    );
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
        url: url.vrow({ ...this._config, viewId: this.id }),
        params: qs
      },
      this._config.token
    );
    const params = { config: this._config, parentId: this.tableId };
    return {
      nodes: nodes.map((row: APIRow) => new RowImpl(params, row)),
      totalCount
    };
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
  async row(rowId: string): Promise<Row> {
    const row = await callApi<APIRow>(
      {
        method: "get",
        url: url.vrow({ ...this._config, viewId: this.id, rowId })
      },
      this._config.token
    );
    const params = { config: this._config, parentId: this.tableId };
    return new RowImpl(params, row);
  }
  async addRow(): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: url.row({ ...this._config, tableId: this.tableId })
      },
      this._config.token
    );
    return id;
  }
  async delete(): Promise<void> {
    await callApi(
      {
        method: "delete",
        url: url.view({ ...this._config, viewId: this.id })
      },
      this._config.token
    );
  }
}
