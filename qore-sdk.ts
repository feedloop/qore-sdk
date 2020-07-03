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
type UrlPath = {
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
    _url: UrlPath;
    _token: string;
    constructor(params: APIMember & { url: UrlPath, jwtToken: string }) {
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
    _url: UrlPath;
    _token: string;
    constructor(params: APIRole & { url: UrlPath, jwtToken: string }) {
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
    _url: UrlPath;
    _token: string;
    constructor(params: { url: UrlPath, jwtToken: string, parentId: string, rowId: string }) {
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
    _url: UrlPath;
    _token: string;
    constructor(params: APIView & { url: UrlPath, jwtToken: string }) {
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
function generateUrlPath(config) {
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
const core = (config: ProjectConfig) => {
    const url: UrlPath = generateUrlPath(config)
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
export default core