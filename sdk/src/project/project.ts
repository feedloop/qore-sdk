import { callApi } from "../common";
import { APITable, Table, TableImpl } from "./table";
import {
  APIView,
  APIViewSummary,
  View,
  ViewImpl,
  ViewSummary,
  ViewSummaryImpl
} from "./view";
import { APIRole, Role, RoleImpl } from "./role";
import { APIMember, Member, MemberImpl } from "./member";
import { url } from "./url";
import { Rows } from "./row";
import {
  APIAuthConfig,
  AuthConfigImpl,
  PasswordAuthConfig,
  QoreAuthConfig
} from "./authConfig";
import {
  APIForm,
  APIFormSummary,
  Form,
  FormImpl,
  FormSummary,
  FormSummaryImpl
} from "./form";
import { APIWorkflow, Workflow, WorkflowImpl } from "./workflow";

export type ProjectConfig = {
  organizationId: string;
  projectId: string;
  token?: string;
};

export default (config: ProjectConfig) => {
  if (config.token) config.token = "Bearer " + config.token;
  return {
    setToken: (token: string) => {
      config.token = token;
    },
    createTable: async (
      params: Omit<APITable, "id" | "fields" | "type">
    ): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.table(config),
          data: params
        },
        config.token
      );
      return id;
    },
    tables: async (limit?: number, offset?: number): Promise<Table[]> => {
      const { nodes } = await callApi<Rows<APITable>>(
        {
          method: "get",
          url: url.table(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(table => new TableImpl({ ...table, config }));
    },
    table: async (tableId: string): Promise<Table> => {
      const table = await callApi<APITable>(
        {
          method: "get",
          url: url.table({ ...config, tableId })
        },
        config.token
      );
      return new TableImpl({ ...table, config });
    },
    createView: async (
      params: Omit<APIView, "id" | "vields"> & { vields: string[] }
    ): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.view(config),
          data: params
        },
        config.token
      );
      return id;
    },
    views: async (limit?: number, offset?: number): Promise<ViewSummary[]> => {
      const { nodes } = await callApi<Rows<APIViewSummary>>(
        {
          method: "get",
          url: url.view(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(view => new ViewSummaryImpl({ ...view, config }));
    },
    view: async (viewId: string): Promise<View> => {
      const view = await callApi<APIView>(
        {
          method: "get",
          url: url.view({ ...config, viewId })
        },
        config.token
      );
      return new ViewImpl({ ...view, config });
    },
    createForm: async (params: Omit<APIForm, "id">): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.form(config),
          data: params
        },
        config.token
      );
      return id;
    },
    forms: async (limit?: number, offset?: number): Promise<FormSummary[]> => {
      const { nodes } = await callApi<Rows<APIFormSummary>>(
        {
          method: "get",
          url: url.form(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(form => new FormSummaryImpl({ ...form, config }));
    },
    form: async (formId: string): Promise<Form> => {
      const form = await callApi<APIForm>(
        {
          method: "get",
          url: url.form({ ...config, formId })
        },
        config.token
      );
      return new FormImpl({ ...form, config });
    },
    auth: {
      async signInWithUserToken(userToken: string) {
        const { token } = await callApi(
          {
            method: "post",
            url: url.projectLogin(config),
            data: { token: userToken }
          },
          "Bearer " + userToken
        );
        config.token = "Bearer " + token;
      },
      signOut() {
        config.token = undefined;
      },
      token() {
        return config.token;
      }
    },
    authConfig: async () => {
      const authConfig = await callApi<APIAuthConfig>(
        {
          method: "get",
          url: url.authConfig(config)
        },
        config.token
      );
      return new AuthConfigImpl({ authConfig, config });
    },
    createAuthConfig: async (
      params: Omit<QoreAuthConfig, "id"> | Omit<PasswordAuthConfig, "id">
    ) => {
      await callApi(
        {
          method: "post",
          url: url.authConfig(config),
          data: params
        },
        config.token
      );
    },
    createRole: async (
      params: Omit<APIRole, "id" | "isAdmin">
    ): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.role(config),
          data: params
        },
        config.token
      );
      return id;
    },
    roles: async (limit?: number, offset?: number): Promise<Role[]> => {
      const { nodes } = await callApi<Rows<APIRole>>(
        {
          method: "get",
          url: url.role(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(role => new RoleImpl({ role, config }));
    },
    role: async (roleId: string): Promise<Role> => {
      const role = await callApi<APIRole>(
        {
          method: "get",
          url: url.role({ ...config, roleId })
        },
        config.token
      );
      return new RoleImpl({ role, config });
    },
    createMember: async (params: {
      email: string;
      roleId?: string;
    }): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.member(config),
          data: params
        },
        config.token
      );
      return id;
    },
    members: async (limit?: number, offset?: number): Promise<Member[]> => {
      const { nodes } = await callApi<Rows<APIMember>>(
        {
          method: "get",
          url: url.member(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(member => new MemberImpl({ ...member, config }));
    },
    member: async (memberId: string): Promise<Member> => {
      const member = await callApi<APIMember>(
        {
          method: "get",
          url: url.member({ ...config, memberId })
        },
        config.token
      );
      return new MemberImpl({ ...member, config });
    },
    sandbox: async (): Promise<string> => {
      const project = await callApi<{ id: string }>(
        {
          method: "get",
          url: url.sandbox({ ...config })
        },
        config.token
      );
      return project.id;
    },
    createSandbox: async (): Promise<string> => {
      const project = await callApi<{ id: string }>(
        {
          method: "post",
          url: url.sandbox({ ...config })
        },
        config.token
      );
      return project.id;
    },
    deploySandbox: async (): Promise<boolean> => {
      const { ok } = await callApi<{ ok: boolean }>(
        {
          method: "patch",
          url: url.sandbox({ ...config }) + "/deploy"
        },
        config.token
      );
      return ok;
    },
    revertSandbox: async (): Promise<boolean> => {
      const { ok } = await callApi<{ ok: boolean }>(
        {
          method: "patch",
          url: url.sandbox({ ...config }) + "/revert"
        },
        config.token
      );
      return ok;
    },
    createWorkflow: async (
      params: Omit<APIWorkflow, "id">
    ): Promise<string> => {
      const { id } = await callApi(
        {
          method: "post",
          url: url.workflow(config),
          data: params
        },
        config.token
      );
      return id;
    },
    workflows: async (limit?: number, offset?: number): Promise<Workflow[]> => {
      const { nodes } = await callApi<Rows<APIWorkflow>>(
        {
          method: "get",
          url: url.workflow(config),
          params: { limit, offset }
        },
        config.token
      );
      return nodes.map(workflow => new WorkflowImpl({ ...workflow, config }));
    }
  };
};
