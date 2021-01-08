import { callApi } from "../common";
import { QoreProjectSchema } from "../project";
import { AccountImpl, APIAccount, Account } from "./account";
import { APIProject, Project, ProjectImpl } from "./project";
import { Rows } from "./row";
import { UrlUserPath } from "./url";

export type APIOrganization = {
  id: string;
  name: string;
  category: string;
  size: string;
  subdomain: string;
};

export type Organization = APIOrganization & {
  accounts(limit?: number, offset?: number): Promise<Account[]>;
  inviteAccount(params: { email: string; type: string }): Promise<void>;
  createProject(params: {
    name: string;
    schema?: QoreProjectSchema;
  }): Promise<string>;
  projects(
    limit?: number,
    offset?: number
  ): Promise<{ projects: Project[]; totalCount: number }>;
  project(id: string): Promise<Project>;
  delete(): Promise<void>;
  update(org: Partial<APIOrganization>): Promise<void>;
};

export class OrganizationImpl implements Organization {
  id: string;
  name: string;
  category: string;
  subdomain: string;
  size: string;
  _url: UrlUserPath;
  _token: string;
  constructor(
    params: APIOrganization & { url: UrlUserPath; userToken: string }
  ) {
    this.id = params.id;
    this.name = params.name;
    this.subdomain = params.subdomain;
    this.category = params.category;
    this.size = params.size;
    this._url = params.url;
    this._token = params.userToken;
  }
  async accounts(limit?: number, offset?: number): Promise<Account[]> {
    const { nodes } = await callApi<Rows<APIAccount>>(
      {
        method: "get",
        url: this._url.account(this.id),
        params: { limit, offset }
      },
      this._token
    );
    return nodes.map(
      account =>
        new AccountImpl({
          ...account,
          userToken: this._token,
          url: this._url,
          orgId: this.id
        })
    );
  }
  async inviteAccount(params: { email: string; type: string }): Promise<void> {
    await callApi(
      {
        method: "post",
        url: this._url.account(this.id),
        data: params
      },
      this._token
    );
  }
  async createProject(params: {
    name: string;
    schema?: QoreProjectSchema;
  }): Promise<string> {
    const { id } = await callApi(
      {
        method: "post",
        url: this._url.project(this.id),
        data: params
      },
      this._token
    );
    return id;
  }
  async projects(
    limit = 10,
    offset = 0
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const { nodes, totalCount } = await callApi(
      {
        method: "get",
        url: this._url.project(this.id),
        params: { limit, offset }
      },
      this._token
    );
    return {
      projects: nodes.map(
        (row: APIProject) =>
          new ProjectImpl({
            ...row,
            userToken: this._token,
            url: this._url,
            orgId: this.id
          })
      ),
      totalCount
    };
  }
  async project(id: string): Promise<Project> {
    const project = await callApi<APIProject>(
      {
        method: "get",
        url: this._url.project(this.id, id)
      },
      this._token
    );
    return new ProjectImpl({
      ...project,
      userToken: this._token,
      url: this._url,
      orgId: this.id
    });
  }
  async delete(): Promise<void> {
    await callApi(
      {
        method: "delete",
        url: this._url.organization(this.id)
      },
      this._token
    );
  }
  async update(org: Partial<APIOrganization>): Promise<void> {
    await callApi(
      {
        method: "patch",
        url: this._url.organization(this.id),
        data: org
      },
      this._token
    );
  }
}
