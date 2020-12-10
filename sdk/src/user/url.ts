export type UrlUserPath = {
  register(): string;
  login(): string;
  organization(id?: string): string;
  account(orgId: string, id?: string): string;
  project(orgId: string, id?: string): string;
};

export function generateUrlUserPath() {
  const url = {
    register(): string {
      return '/register';
    },
    verify(): string {
      return '/verify';
    },
    login(): string {
      return '/login';
    },
    organization(id?: string): string {
      return id ? '/orgs/' + id : '/orgs';
    },
    account(orgId: string, id?: string): string {
      return url.organization(orgId) + (id ? '/accounts/' + id : '/accounts');
    },
    project(orgId: string, id?: string): string {
      return url.organization(orgId) + (id ? '/projects/' + id : '/projects');
    },
  };
  return url;
}
