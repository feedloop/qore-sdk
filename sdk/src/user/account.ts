import { callApi } from "../common";
import { UrlUserPath } from "./url";
import { APIUser } from "./user";

export type APIAccount = {
  id: string;
  user: APIUser;
  type: string;
};

export type Account = APIAccount & {
  delete(): Promise<void>;
  updateType(type: string): Promise<void>;
};

export class AccountImpl implements Account {
  id: string;
  user: APIUser;
  type: string;
  _orgId: string;
  _url: UrlUserPath;
  _token: string;
  constructor(
    params: APIAccount & { url: UrlUserPath; userToken: string; orgId: string }
  ) {
    this.id = params.id;
    this.user = params.user;
    this.type = params.type;
    this._orgId = params.orgId;
    this._url = params.url;
    this._token = params.userToken;
  }
  async updateType(type: string) {
    await callApi(
      {
        method: "patch",
        url: this._url.account(this._orgId, this.id),
        data: { type }
      },
      this._token
    );
  }
  async delete() {
    await callApi(
      {
        method: "delete",
        url: this._url.account(this._orgId, this.id)
      },
      this._token
    );
  }
}
