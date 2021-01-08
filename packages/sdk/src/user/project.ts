import { callApi } from "../common";
import { UrlUserPath } from "./url";

export type APIProject = {
  id: string;
  name: string;
};
export type Table = {
  id: string;
  name: string;
};

export type Project = APIProject & {
  tables(props?: { limit: number; offset: number }): Promise<Table[]>;
  delete(): Promise<void>;
  update(project: Partial<APIProject>): Promise<void>;
};

export class ProjectImpl implements Project {
  id: string;
  name: string;
  _orgId: string;
  _url: UrlUserPath;
  _token: string;
  constructor(
    params: APIProject & { url: UrlUserPath; userToken: string; orgId: string }
  ) {
    this.id = params.id;
    this.name = params.name;
    this._orgId = params.orgId;
    this._url = params.url;
    this._token = params.userToken;
  }
  async get() {
    await callApi(
      {
        method: "get",
        url: this._url.project(this._orgId)
      },
      this._token
    );
  }
  async tables(
    props: { limit?: number; offset?: number } = {}
  ): Promise<Table[]> {
    const { nodes } = await callApi(
      {
        method: "get",
        url: this._url.project(this._orgId, this.id) + "/tables"
      },
      this._token
    );
    return nodes;
  }
  async delete() {
    await callApi(
      {
        method: "delete",
        url: this._url.project(this._orgId, this.id)
      },
      this._token
    );
  }
  async update(project: Partial<APIProject>) {
    await callApi(
      {
        method: "patch",
        url: this._url.project(this._orgId, this.id),
        data: project
      },
      this._token
    );
  }
}
