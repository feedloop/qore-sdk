import { callApi } from '../common';
import { Project, ProjectImpl } from './project';
import { APIOrganization, Organization, OrganizationImpl } from './organization';
import { generateUrlUserPath } from './url';

export type APIUser = {
  email: string;
  token: string;
};

export type QoreUser = {
  register(params: { email: string; password: string }): Promise<void>;
  logout(): void;
  login(email: string, password: string): Promise<void>;
  verify(email: string, activationCode: string): Promise<void>;
  createOrganization(params: { name: string; category: string; size: string }): Promise<string>;
  organizations(limit?: number, offset?: number): Promise<Organization[]>;
  organization(id: string): Promise<Organization | undefined>;
  projects(orgId: string, props?: { limit?: number; offset?: number }): Promise<Project[]>;
  user(): APIUser | undefined;
};

export default () => {
  let user: APIUser;
  const url = generateUrlUserPath();
  return {
    setToken(token: string) {
      user = { email: '', token };
    },
    async register(params: { email: string; password: string }): Promise<void> {
      await callApi({
        method: 'post',
        url: url.register(),
        data: params,
      });
    },
    async login(email: string, password: string): Promise<void> {
      const { token } = await callApi({
        method: 'post',
        url: url.login(),
        data: { email, password },
      });
      user = { email, token: 'Bearer ' + token };
    },
    async verify(email: string, activationCode: string): Promise<void> {
      const { token } = await callApi({
        method: 'post',
        url: url.verify(),
        data: { email, activationCode },
      });
      user = { email, token: 'Bearer ' + token };
    },
    async createOrganization(params: {
      name: string;
      category: string;
      size: string;
      subdomain: string;
    }): Promise<string> {
      const { id } = await callApi(
        {
          method: 'post',
          url: url.organization(),
          data: params,
        },
        user.token
      );
      return id;
    },
    async projects(orgId: string, props: { limit?: number; offset?: number }): Promise<Project[]> {
      const { limit, offset } = props || {};
      const { nodes } = await callApi(
        {
          method: 'get',
          url: url.project(orgId),
          params: { limit, offset },
        },
        user.token
      );
      return nodes.map(
        (row: APIOrganization) => new ProjectImpl({ ...row, userToken: user.token, url, orgId })
      );
    },
    async organizations(limit?: number, offset?: number): Promise<Organization[]> {
      const { nodes } = await callApi(
        {
          method: 'get',
          url: url.organization(),
          params: { limit, offset },
        },
        user.token
      );
      return nodes.map(
        (row: APIOrganization) => new OrganizationImpl({ ...row, userToken: user.token, url })
      );
    },
    async organization(id: string): Promise<Organization> {
      // NOT IMPLEMENTED IN BACKEND
      // const org = await callApi<APIOrganization>(
      //   {
      //     method: 'get',
      //     url: url.organization(id),
      //   },
      //   user.token
      // );
      return new OrganizationImpl({
        ...{ id, category: '', size: '', name: '', subdomain: '' },
        userToken: user.token,
        url,
      });
    },
    user: () => user,
    logout: () => {
      user = { token: '', email: '' };
    },
  };
};
