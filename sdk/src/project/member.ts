import { callApi } from '../common';
import { ProjectConfig } from './project';
import { url } from './url';

export type APIMember = {
  id: string;
  email: string;
};

export type Member = APIMember & {
  _config: ProjectConfig;
  delete(): Promise<void>;
};

export class MemberImpl implements Member {
  id: string;
  email: string;
  _config: ProjectConfig;
  constructor(params: APIMember & { config: ProjectConfig }) {
    this.id = params.id;
    this.email = params.email;
    this._config = params.config;
  }
  delete = async () => {
    await callApi(
      {
        method: 'delete',
        url: url.member({ ...this._config, memberId: this.id }),
      },
      this._config.token
    );
  };
}
