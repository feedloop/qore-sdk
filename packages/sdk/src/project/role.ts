import { callApi } from "../common";
import { ProjectConfig } from "./project";
import { url } from "./url";

export type Permission = {
  viewId: string;
  insert: boolean;
  select: boolean;
  update: boolean;
  delete: boolean;
};

export type APIRole = {
  id: string;
  name: string;
  isAdmin: boolean;
  permissions: Permission[];
};

export type Role = APIRole & {
  _config: ProjectConfig;
  delete(): Promise<void>;
  update(role: Partial<Omit<APIRole, "id" | "isAdmin">>): Promise<void>;
};

export class RoleImpl implements Role {
  id: string;
  name: string;
  isAdmin: boolean;
  permissions: Permission[];
  _config: ProjectConfig;
  constructor(params: { role: APIRole; config: ProjectConfig }) {
    this.id = params.role.id;
    this.permissions = params.role.permissions;
    this.name = params.role.name;
    this.isAdmin = params.role.isAdmin;
    this._config = params.config;
  }
  async delete(): Promise<void> {
    await callApi(
      {
        method: "delete",
        url: url.role({ ...this._config, roleId: this.id })
      },
      this._config.token
    );
  }
  async update(role: Partial<Omit<APIRole, "id">>): Promise<void> {
    await callApi(
      {
        method: "patch",
        url: url.role({ ...this._config, roleId: this.id }),
        data: role
      },
      this._config.token
    );
  }
}
