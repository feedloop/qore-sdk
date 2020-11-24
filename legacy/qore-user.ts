import { callApi } from './common'
type UrlUserPath = {
    register(): string
    login(): string
    organization(id?: string): string
    account(orgId: string, id?: string): string
    project(orgId: string, id?: string): string
}
function generateUrlUserPath() {
    const url = {
        register(): string { return '/register' },
        verify(): string { return '/verify' },
        login(): string { return '/login' },
        organization(id?: string): string { return id ? '/orgs/' + id : '/orgs' },
        account(orgId: string, id?: string): string { return url.organization(orgId) + (id ? '/accounts/' + id : '/accounts') },
        project(orgId: string, id?: string): string { return url.organization(orgId) + (id ? '/projects/' + id : '/projects') }
    }
    return url
}
type APIOrganization = {
    id: string;
    name: string;
    category: string;
    size: string;
    subdomain: string;
}
type APIUser = {
    email: string;
    token: string
}
type APIAccount = {
    id: string
    user: APIUser
    type: string
}
type Account = APIAccount & {
    delete(): Promise<void>
    updateType(type: string): Promise<void>
}
type APIProject = {
    id: string;
    name: string
}
type Project = APIProject & {
    delete(): Promise<void>
    update(project: Partial<APIProject>): Promise<void>
}
type Organization = APIOrganization & {
    accounts(limit?: number, offset?: number): Promise<Account[]>
    inviteAccount(params: { email: string, type: string }): Promise<void>
    createProject(params: { name: string }): Promise<string>
    projects(limit?: number, offset?: number): Promise<Project[]>
    project(id: string): Promise<Project>
    delete(): Promise<void>
    update(org: Partial<APIOrganization>): Promise<void>
}
class AccountImpl implements Account {
    id: string
    user: APIUser
    type: string
    _orgId: string;
    _url: UrlUserPath;
    _token: string;
    constructor(params: APIAccount & { url: UrlUserPath, userToken: string, orgId: string }) {
        this.id = params.id
        this.user = params.user
        this.type = params.type
        this._orgId = params.orgId
        this._url = params.url
        this._token = params.userToken
    }
    async updateType(type: string) {
        await callApi({
            method: "patch",
            url: this._url.account(this._orgId, this.id),
            data: { type }
        }, this._token)
    }
    async delete() {
        await callApi({
            method: "delete",
            url: this._url.account(this._orgId, this.id),
        }, this._token)
    }
}
class ProjectImpl implements Project {
    id: string;
    name: string
    _orgId: string;
    _url: UrlUserPath;
    _token: string;
    constructor(params: APIProject & { url: UrlUserPath, userToken: string, orgId: string }) {
        this.id = params.id
        this.name = params.name
        this._orgId = params.orgId
        this._url = params.url
        this._token = params.userToken
    }
    async delete() {
        await callApi({
            method: "delete",
            url: this._url.project(this._orgId, this.id),
        }, this._token)
    }
    async update(project: Partial<APIProject>) {
        await callApi({
            method: "patch",
            url: this._url.project(this._orgId, this.id),
            data: project
        }, this._token)
    }
}
class OrganizationImpl implements Organization {
    id: string;
    name: string;
    category: string;
    subdomain: string;
    size: string;
    _url: UrlUserPath;
    _token: string;
    constructor(params: APIOrganization & { url: UrlUserPath, userToken: string }) {
        this.id = params.id
        this.name = params.name
        this.subdomain = params.subdomain
        this.category = params.category
        this.size = params.size
        this._url = params.url
        this._token = params.userToken
    }
    async accounts(limit?: number, offset?: number): Promise<Account[]> {
        const { nodes } = await callApi({
            method: "get",
            url: this._url.account(this.id),
            params: { limit, offset }
        }, this._token)
        return nodes.map(row => new AccountImpl({ ...row, userToken: this._token, url: this._url, orgId: this.id }))
    }
    async inviteAccount(params: { email: string, type: string }): Promise<void> {
        await callApi({
            method: "post",
            url: this._url.account(this.id),
            data: params
        }, this._token)
    }
    async createProject(params: { name: string }): Promise<string> {
        const { id } = await callApi({
            method: "post",
            url: this._url.project(this.id),
            data: params
        }, this._token)
        return id
    }
    async projects(limit = 10, offset = 0): Promise<Project[]> {
        const { nodes } = await callApi({
            method: "get",
            url: this._url.project(this.id),
            params: { limit, offset }
        }, this._token)
        return nodes.map(row => new ProjectImpl({ ...row, userToken: this._token, url: this._url, orgId: this.id }))
    }
    async project(id: string): Promise<Project> {
        const project = await callApi({
            method: "get",
            url: this._url.project(this.id, id),
        }, this._token)
        return new ProjectImpl({ ...project, userToken: this._token, url: this._url, orgId: this.id })
    }
    async delete(): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.organization(this.id)
        }, this._token)
    }
    async update(org: Partial<APIOrganization>): Promise<void> {
        await callApi({
            method: "patch",
            url: this._url.organization(this.id),
            data: org
        }, this._token)
    }
}
export default () => {
    let user: APIUser;
    const url = generateUrlUserPath()
    return {
        async register(params: { email: string, password: string }): Promise<void> {
            await callApi({
                method: "post",
                url: url.register(),
                data: params
            })
        },
        async login(email: string, password: string): Promise<void> {
            const { token } = await callApi({
                method: "post",
                url: url.login(),
                data: { email, password }
            })
            user = { email, token: 'Bearer ' + token }
        },
        async verify(email: string, activationCode: string): Promise<void> {
            const { token } = await callApi({
                method: "post",
                url: url.verify(),
                data: { email, activationCode }
            })
            user = { email, token }
        },
        async createOrganization(params: { name: string, category: string, size: string }): Promise<string> {
            const { id } = await callApi({
                method: "post",
                url: url.organization(),
                data: params
            }, user.token)
            return id
        },
        async organizations(limit?: number, offset?: number): Promise<Organization[]> {
            const { nodes } = await callApi({
                method: "get",
                url: url.organization(),
                params: { limit, offset }
            }, user.token)
            return nodes.map(row => new OrganizationImpl({ ...row, userToken: user.token, url, orgId: this.id }))
        },
        async organization(id: string): Promise<Organization> {
            const org = await callApi({
                method: "get",
                url: url.organization(id),
            }, user.token)
            return new OrganizationImpl({ ...org, userToken: user.token, url, orgId: this.id })
        },
        user: () => user
    }

}