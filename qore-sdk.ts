import Axios from 'axios';
type BaseField = {
    id: string;
    name: string;
}
type Types = {
    text: TextField;
    number: NumberField
    date: DateField
    rollup: RollupField
    lookup: LookupField
    relation: RelationField
    select: SelectField
    formula: FormulaField
    action: ActionField
};
type TextField = BaseField & { type: 'text', defaultValue: string }
type NumberField = BaseField & { type: 'number', defaultValue: number }
type DateField = BaseField & { type: 'date', defaultValue: Date }
type RollupField = BaseField & { type: 'rollup', defaultValue: number }
type LookupField = BaseField & { type: 'lookup' }
type RelationField = BaseField & { type: 'relation' }
type SelectField = BaseField & { type: 'select', defaultValue: string }
type FormulaField = BaseField & { type: 'formula', defaultValue: number | string }
type ActionField = BaseField & { type: 'action' }

type keyTypes = Types[keyof Types]['type']
type APIViewVield<T extends keyof Types> = Types[T] & { display: boolean }
type APIView = {
    id: string;
    vields: APIViewVield<keyof Types>[]
}
type APIMember = {
    id: string
    name: string;
    email: string;
    role: APIRole;
}
type APIRole = {
    id: string;
    name: string;
    permissions: string[];
}
interface View {
    id: string;
    vields(): Promise<Vield[]>;
    rows(): Promise<Row[]>
    row(rowId: string): Promise<Row>
    addRow(): Promise<string>
    delete(): Promise<void>
}
type Vield = Types[keyTypes] & {
    hide(): Promise<void>
    show(): Promise<void>
}
type Column = {
    text: { update(value?: string): Promise<void> },
    number: { update(value?: number): Promise<void> }
    select: { update(value?: string): Promise<void> }
    date: { update(value?: Date): Promise<void> }
    rollup: {}
    lookup: {}
    relation: { add(rowId: string): Promise<void>, remove(rowId: string): Promise<void> }
    formula: {}
    action: { execute(params: { [key: string]: any }): Promise<void> }
};
type Row = {
    parentId: string;
    id: string;
    col<T extends Types[keyTypes]>(field: T): Column[T["type"]];
    delete(): Promise<void>
}
type Member = APIMember & {
    delete(): Promise<void>
    updateRole(roleId: string): Promise<void>
}
type Role = APIRole & {}
type ProjectConfig = {
    organizationId: string;
    projectId: string;
}
type UrlUserPath = {
    register(): string
    login(): string
    organization(id?: string): string
    account(orgId: string, id?: string): string
    project(orgId: string, id?: string): string
}
type UrlProjectPath = {
    project(): string
    view(id?: string): string
    field(viewId: string, fieldId?: string): string
    row(viewId: string, rowId?: string): string
    addRowRelation(viewId: string, rowId: string, fieldId: string): string
    removeRowRelation(viewId: string, rowId: string, fieldId: string, refRowId: string): string
    projectLogin(): string
    member(memberId?: string): string
    role(roleId?: string): string
}
const API_URL = ""
async function callApi(params: { method: "get" | "post" | "put" | "delete" | "patch", url: string, data?: { [key: string]: any }, params?: { [key: string]: any } }, token?: string) {
    const headers = {}
    if (token) {
        headers['Authorization'] = 'Bearer ' + token
    }
    try {
        return (await Axios({ ...params, headers, url: API_URL + params.url })).data
    } catch (error) {
        const data = error.response.data
        if (data && data.error) throw new Error(data.error)
        throw new Error('Cannot get response from server')
    }
}
class MemberImpl implements Member {
    id;
    name: string;
    email: string;
    role: Role;
    _url: UrlProjectPath;
    _token: string;
    constructor(params: APIMember & { url: UrlProjectPath, jwtToken: string }) {
        this.id = params.id
        this.email = params.email
        this.name = params.name
        this.role = new RoleImpl({ ...params.role, jwtToken: params.jwtToken, url: params.url })
        this._url = params.url
        this._token = params.jwtToken
    }
    async delete(): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.member(this.id)
        }, this._token)
    }
    async updateRole(roleId: string): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.member(this.id),
            data: { roleId }
        }, this._token)
    }
}
class RoleImpl implements Role {
    id;
    name;
    permissions;
    _url: UrlProjectPath;
    _token: string;
    constructor(params: APIRole & { url: UrlProjectPath, jwtToken: string }) {
        this.id = params.id
        this.permissions = params.permissions
        this.name = params.name
        this._url = params.url
        this._token = params.jwtToken
    }
}
class RowImpl implements Row {
    parentId: string;
    id: string;
    _url: UrlProjectPath;
    _token: string;
    constructor(params: { url: UrlProjectPath, jwtToken: string, parentId: string, rowId: string }) {
        this.parentId = params.parentId
        this.id = params.rowId
        this._url = params.url
        this._token = params.jwtToken
    }
    col(field): any {
        switch (field.type) {
            case "select":
            case "text":
                return {
                    async update(value?: string) {
                        await callApi({
                            method: "put",
                            url: this._url.row(this.parentId, this.id),
                            data: {
                                [field.id]: value
                            }
                        })
                    }
                } as Column['text']
            case "date":
                return {
                    async update(value?: Date) {
                        await callApi({
                            method: "put",
                            url: this._url.row(this.parentId, this.id),
                            data: {
                                [field.id]: value
                            }
                        })
                    }
                }
            case "number":
                return {
                    async update(value?: number) {
                        await callApi({
                            method: "put",
                            url: this._url.row(this.parentId, this.id),
                            data: {
                                [field.id]: value
                            }
                        })
                    }
                }
            case "relation":
                return {
                    async add(value: string) {
                        await callApi({
                            method: "post",
                            url: this._url.addRowRelation(this.parentId, this.id, field.id),
                            data: {
                                [field.id]: value
                            }
                        })
                    },
                    async remove(value: string) {
                        await callApi({
                            method: "delete",
                            url: this._url.removeRowRelation(this.parentId, this.id, field.id, value),
                        })
                    }
                }
            case "action":
                return {
                    async execute(params: { [key: string]: any }) {
                        await callApi({
                            method: "delete",
                            url: this._url.field(this.parentId, field.id),
                            data: { rowId: this.id, params }
                        })
                    }
                }
            case "lookup":
            case "rollup":
            case "formula":
                return {}
        }
    }
    async delete(): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.row(this.parentId, this.id)
        }, this._token)
        return
    }
}
class ViewImpl implements View {
    id;
    _vields: APIViewVield<keyof Types>[];
    _url: UrlProjectPath;
    _token: string;
    constructor(params: APIView & { url: UrlProjectPath, jwtToken: string }) {
        this.id = params.id
        this._vields = params.vields
        this._url = params.url
        this._token = params.jwtToken
    }
    async vields(): Promise<Vield[]> {
        return this._vields.map(field => ({
            ...field,
            hide: async (): Promise<void> => {
                await callApi({
                    method: "patch",
                    url: this._url.field(this.id, field.id),
                    data: { display: false }
                }, this._token)
            },
            show: async (): Promise<void> => {
                await callApi({
                    method: "patch",
                    url: this._url.field(this.id, field.id),
                    data: { display: true }
                }, this._token)
            }
        }))
    }
    async rows(): Promise<Row[]> {
        const { nodes } = await callApi({
            method: "get",
            url: this._url.row(this.id)
        }, this._token)
        return nodes.map(row => new RowImpl({ jwtToken: this._token, url: this._url, parentId: this.id, rowId: row.id }))
    }
    async row(rowId: string): Promise<Row> {
        const row = await callApi({
            method: "get",
            url: this._url.row(this.id, rowId)
        }, this._token)
        return new RowImpl({ jwtToken: this._token, url: this._url, parentId: this.id, rowId: row.id })
    }
    async addRow(): Promise<string> {
        const { id } = await callApi({
            method: "post",
            url: this._url.row(this.id)
        }, this._token)
        return id
    }
    async delete(): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.row(this.id)
        }, this._token)
    }
}
function generateUrlProjectPath(config) {
    const url = {
        project() {
            return `/orgs/${config.organizationId}/projects/${config.projectId}`
        },
        view(id?: string) {
            if (!id) return "/views"
            return url.project() + "/views/" + id
        },
        field(viewId: string, fieldId?: string) {
            const viewUrl = url.view(viewId)
            const fieldUrl = viewUrl + "/fields"
            if (!fieldId) return fieldUrl
            return fieldUrl + "/" + fieldId
        },
        row(viewId: string, rowId?: string) {
            const viewUrl = url.view(viewId)
            const rowUrl = viewUrl + "/rows"
            if (!rowId) return rowUrl
            return rowUrl + "/" + rowId
        },
        addRowRelation(viewId: string, rowId: string, fieldId: string) {
            const viewUrl = url.view(viewId)
            return viewUrl + "/rows" + "/" + rowId + "/" + fieldId
        },
        removeRowRelation(viewId: string, rowId: string, fieldId: string, refRowId: string) {
            const viewUrl = url.view(viewId)
            return viewUrl + "/rows" + "/" + rowId + "/" + fieldId + "/" + refRowId
        },
        projectLogin() {
            return url.project() + "/authenticate"
        },
        member(memberId?: string) {
            return !memberId ? url.project() + "/members" : url.project() + "/members/" + memberId
        },
        role(roleId?: string) {
            return !roleId ? url.project() + "/roles" : url.project() + "/roles/" + roleId
        }
    }
    return url
}
function generateUrlUserPath() {
    const url = {
        register(): string {
            return '/register'
        },
        login(): string { return '/login' },
        organization(id?: string): string { return id ? '/orgs/' + id : '/orgs' },
        account(orgId: string, id?: string): string { return url.organization(orgId) + (id ? '/' + id : '') },
        project(orgId: string, id?: string): string { return url.organization(orgId) + (id ? '/' + id : '') }
    }
    return url
}
export const coreProject = (config: ProjectConfig) => {
    const url: UrlProjectPath = generateUrlProjectPath(config)
    let jwtToken;
    return {
        createView: async (params: { name: string, tableId: string }): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.view(),
                data: params
            }, jwtToken)
            return id
        },
        views: async (): Promise<View[]> => {
            const views = await callApi({
                method: "post",
                url: url.view()
            }, jwtToken)
            return views.map(view => new ViewImpl({ ...view, jwtToken, url }))
        },
        view: async (id: string): Promise<View> => {
            const view = await callApi({
                method: "post",
                url: url.view(id)
            }, jwtToken)
            return new ViewImpl({ ...view, jwtToken, url })
        },
        auth: {
            async signInWithUserToken(userToken: string) {
                const { jwtToken: token } = await callApi({
                    method: "post",
                    url: url.projectLogin(),
                    data: { userToken }
                })
                jwtToken = token
            },
            signOut() { jwtToken = undefined }
        },
        roles: async () => {
            const { nodes } = await callApi({
                method: "get",
                url: url.role()
            }, jwtToken)
            return nodes.map(role => new RoleImpl({ ...role, jwtToken, url }))
        },
        role: async (roleId: string) => {
            const role = await callApi({
                method: "get",
                url: url.role(roleId)
            }, jwtToken)
            return new RoleImpl({ ...role, jwtToken, url })
        },
        createMember: async (email: string, roleId?: string): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.member(),
                data: { email, roleId }
            }, jwtToken)
            return id
        },
        members: async (): Promise<Member[]> => {
            const { nodes } = await callApi({
                method: "get",
                url: url.member()
            }, jwtToken)
            return nodes.map(member => new MemberImpl({ ...member, jwtToken, url }))
        },
        member: async (memberId: string): Promise<Member> => {
            const member = await callApi({
                method: "get",
                url: url.member(memberId)
            }, jwtToken)
            return new MemberImpl({ ...member, jwtToken, url })
        }
    }
}
type APIOrganization = {
    id: string;
    name: string;
    category: string;
    size: string;
}
type APIUser = {
    id: string;
    name: string;
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
    updateName(name: string): Promise<void>
}
type Organization = APIOrganization & {
    accounts(limit?: number, offset?: number): Promise<Account[]>
    inviteAccount(params: { email: string, type: string }): Promise<void>
    createProject(params: { name: string }): Promise<string>
    projects(limit?: number, offset?: number): Promise<Project[]>
    project(id: string): Promise<Project>
    delete(): Promise<void>
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
    async updateName(name: string) {
        await callApi({
            method: "patch",
            url: this._url.project(this._orgId, this.id),
            data: { name }
        }, this._token)
    }
}
class OrganizationImpl implements Organization {
    id: string;
    name: string;
    category: string;
    size: string;
    _url: UrlUserPath;
    _token: string;
    constructor(params: APIOrganization & { url: UrlUserPath, userToken: string }) {
        this.id = params.id
        this.name = params.name
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
}
export const coreUser = () => {
    let user: APIUser;
    const url = generateUrlUserPath()
    return {
        async register(params: { email: string, name: string, password: string }): Promise<void> {
            user = await callApi({
                method: "post",
                url: url.register(),
                data: params
            })
        },
        async login(username: string, password: string): Promise<void> {
            user = await callApi({
                method: "post",
                url: url.login(),
                data: { username, password }
            })
        },
        async createOrganization(params: { name: string, category: string, size: string }): Promise<string> {
            const { id } = await callApi({
                method: "post",
                url: url.organization(),
                data: params
            })
            return id
        },
        async organizations(limit?: number, offset?: number): Promise<Organization[]> {
            const { nodes } = await callApi({
                method: "get",
                url: this._url.organization(),
                params: { limit, offset }
            }, this._token)
            return nodes.map(row => new OrganizationImpl({ ...row, userToken: this._token, url: this._url, orgId: this.id }))
        },
        async organization(id: string): Promise<Organization> {
            const org = await callApi({
                method: "get",
                url: this._url.organization(id),
            }, this._token)
            return new OrganizationImpl({ ...org, userToken: this._token, url: this._url, orgId: this.id })
        },
        user
    }

}