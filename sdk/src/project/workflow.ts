import { callApi } from "../common";
import { ProjectConfig } from "./project";
import { url } from "./url";

export type WebhookAction = {
  type: "webhook";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  transformUrl?: Record<string, string>;
};

export type DatabaseOperationAction = {
  type: "database-operation";
  projectId: string;
  tableId: string;
  schema: string;
  operation: "select";
  fields: string[];
};

export type SequenceAction = {
  type: "sequence";
  steps: (WebhookAction | DatabaseOperationAction)[];
};

export type WorkflowAction = {
  id: string;
} & (WebhookAction | DatabaseOperationAction | SequenceAction);

export type WorkflowCondition = {
  field: string;
  values: string[];
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "between";
};

export type APIWorkflow = {
  id: string;
  tableId: string;
  name: string;
  event: "onRowCreate" | "onRowUpdate" | "onRowDelete";
  type: "trigger";
  active: boolean;
  actions: WorkflowAction[];
  preCondition?: {
    and?: WorkflowCondition[];
    or?: WorkflowCondition[];
  };
};

export interface Workflow extends APIWorkflow {
  _config: ProjectConfig;
  delete(): Promise<void>;
  update(workflow: Partial<Omit<APIWorkflow, "id">>): Promise<void>;
}

export class WorkflowImpl implements Workflow {
  id: Workflow["id"];
  tableId: Workflow["tableId"];
  name: Workflow["name"];
  event: Workflow["event"];
  type: Workflow["type"];
  active: Workflow["active"];
  actions: Workflow["actions"];
  preCondition: Workflow["preCondition"];
  _config: ProjectConfig;
  constructor(params: APIWorkflow & { config: ProjectConfig }) {
    this.id = params.id;
    this.tableId = params.tableId;
    this.name = params.name;
    this.event = params.event;
    this.type = params.type;
    this.active = params.active;
    this.actions = params.actions;
    this.preCondition = params.preCondition;
    this._config = params.config;
  }

  delete(): Promise<void> {
    return callApi(
      {
        method: "delete",
        url: url.workflow({ ...this._config, workflowId: this.id })
      },
      this._config.token
    );
  }

  update(workflow: Partial<Omit<APIWorkflow, "id" | "type">>): Promise<void> {
    return callApi(
      {
        method: "patch",
        url: url.workflow({ ...this._config, workflowId: this.id }),
        data: workflow
      },
      this._config.token
    );
  }
}
