import { ProjectConfig } from "./project";
import { url } from "./url";
import { callApi } from "../common";

export type QoreAuthConfig = {
  id: string;
  type: "qore";
  table: string;
  identifierField: string;
  roleField: string;
};

export type PasswordAuthConfig = {
  id: string;
  type: "password";
  table: string;
  identifierField: string;
  roleField: string;
  passwordField: string;
};

export type APIAuthConfig = {
  qore?: QoreAuthConfig;
  password?: PasswordAuthConfig;
};

export type AuthConfigTypes = keyof APIAuthConfig;

export type AuthConfig = APIAuthConfig & {
  _config: ProjectConfig;
  update(
    values: Omit<PasswordAuthConfig, "id"> | Omit<QoreAuthConfig, "id">
  ): Promise<void>;
};

export class AuthConfigImpl implements AuthConfig {
  qore?: QoreAuthConfig;
  password?: PasswordAuthConfig;
  _config: ProjectConfig;
  constructor(params: { authConfig: APIAuthConfig; config: ProjectConfig }) {
    this.qore = params.authConfig.qore;
    this.password = params.authConfig.password;
    this._config = params.config;
  }
  async update(
    values: Omit<PasswordAuthConfig, "id"> | Omit<QoreAuthConfig, "id">
  ): Promise<void> {
    const id = this[values.type]?.id;
    if (!id) return;
    await callApi(
      {
        method: "patch",
        url: url.authConfig({ ...this._config, projectAuthId: id }),
        data: {
          type: values.type,
          table: values.table,
          identifierField: values.identifierField,
          roleField: values.roleField,
          // @ts-ignore
          passwordField: values.passwordField,
        },
      },
      this._config.token
    );
  }
}
