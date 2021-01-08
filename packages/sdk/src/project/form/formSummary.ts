import { callApi } from "../../common";
import { ProjectConfig } from "../project";
import { url } from "../url";
import { FormMethod } from "./formMethod";

export type APIFormSummary = {
  id: string;
  name: string;
  tableId: string;
};

export type FormSummary = APIFormSummary & FormMethod;

export class FormSummaryImpl implements FormSummary {
  id: string;
  tableId: APIFormSummary["tableId"];
  name: APIFormSummary["name"];
  _config: ProjectConfig;
  constructor(params: APIFormSummary & { config: ProjectConfig }) {
    this.id = params.id;
    this.name = params.name;
    this.tableId = params.tableId;
    this._config = params.config;
  }

  submit(values: Record<string, string>) {
    return callApi<void>({
      method: "post",
      url: url.form({ formId: this.id, ...this._config }),
      data: { ...values }
    });
  }
}
