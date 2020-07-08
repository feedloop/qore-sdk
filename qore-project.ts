import { callApi } from './common';
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
type TextField = BaseField & { type: 'text', defaultValue?: string }
type NumberField = BaseField & { type: 'number', defaultValue?: number }
type DateField = BaseField & { type: 'date', defaultValue?: Date }
type RollupField = BaseField & { type: 'rollup', defaultValue?: number }
type LookupField = BaseField & { type: 'lookup' }
type RelationField = BaseField & { type: 'relation' }
type SelectField = BaseField & { type: 'select', defaultValue?: string }
type FormulaField = BaseField & { type: 'formula', defaultValue?: number | string, formula: string }
type ActionField = BaseField & { type: 'action' }

type keyTypes = Types[keyof Types]['type']
type APIVield<T extends keyTypes> = Types[T] & { display: boolean }
type APIField<T extends keyTypes> = Types[T]
type APIView = {
    id: string;
    name: string;
    tableId: string;
    vields: APIVield<keyof Types>[];
    filters: string[]
    sorts: { order: string, by: string }[]
}
type APITable = {
    id: string;
    name: string;
    fields: APIField<keyof Types>[];
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
    addVield<T extends Omit<Types[keyTypes], "id">>(field: T): Promise<string>
    vields(): Promise<Vield[]>;
    rows(limit?: number, offset?: number): Promise<Row[]>
    row(rowId: string): Promise<Row>
    addRow(params?: { [key: string]: any }): Promise<string>
    update(view: Omit<APIView, "id" | "vields"> & { vields: string[] }): Promise<void>
    delete(): Promise<void>
}
interface Table {
    id: string;
    addField(field: Omit<Types[keyTypes], "id">): Promise<string>
    fields(): Promise<Field[]>;
    field(id: string): Promise<Field>;
    rows(limit?: number, offset?: number): Promise<Row[]>
    row(rowId: string): Promise<Row>
    addRow(params?: { [key: string]: any }): Promise<string>
    delete(): Promise<void>
    update(view: Partial<Omit<APITable, "id">>): Promise<void>
}
type Field = Types[keyTypes] & {
    delete(): Promise<void>
    update(field: Partial<Omit<Types[keyTypes], "id">>): Promise<void>
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
    col<T extends keyTypes>(field: { id: string, type: T }): Column[T];
    delete(): Promise<void>
}
type Member = APIMember & {
    delete(): Promise<void>
    updateRole(roleId: string): Promise<void>
}
type Role = APIRole & {
    delete(): Promise<void>
    update(role: Partial<Omit<APIRole, "id">>): Promise<void>
}
type ProjectConfig = {
    organizationId: string;
    projectId: string;
}
type UrlProjectPath = {
    project(): string
    view(id?: string): string
    table(id?: string): string
    field(tableId: string, fieldId?: string): string
    vield(viewId: string, fieldId?: string): string
    row(tableId: string, rowId?: string): string
    addRowRelation(viewId: string, rowId: string, fieldId: string): string
    removeRowRelation(viewId: string, rowId: string, fieldId: string, refRowId: string): string
    projectLogin(): string
    member(memberId?: string): string
    role(roleId?: string): string
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
    async delete(): Promise<void> {
        await callApi({
            method: "delete",
            url: this._url.role(this.id)
        }, this._token)
    }
    async update(role: Partial<Omit<APIRole, "id">>): Promise<void> {
        await callApi({
            method: "patch",
            url: this._url.role(this.id),
            data: role
        }, this._token)
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
                }
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
    tableId: APIView['tableId'];
    name: APIView['name'];
    filters: APIView['filters'];
    sorts: APIView['sorts'];
    _vields: APIView['vields'];
    _url: UrlProjectPath;
    _token: string;
    constructor(params: APIView & { url: UrlProjectPath, jwtToken: string }) {
        this.id = params.id
        this.name = params.name
        this.filters = params.filters
        this.sorts = params.sorts
        this.tableId = params.tableId
        this._vields = params.vields
        this._url = params.url
        this._token = params.jwtToken
    }
    async update(view: Omit<APIView, "id" | "vields"> & { vields: string[] }): Promise<void> {
        await callApi({
            method: "patch",
            url: this._url.view(this.id),
            data: view
        }, this._token)
    }
    async addVield<T extends Omit<Types[keyTypes], "id">>(field: T): Promise<string> {
        const { id } = await callApi({
            method: "post",
            url: this._url.vield(this.id),
            data: field
        }, this._token)
        return id
    }
    async vields(): Promise<Vield[]> {
        return this._vields.map(field => ({
            ...field,
            hide: async (): Promise<void> => {
                await callApi({
                    method: "delete",
                    url: this._url.vield(this.id, field.id),
                }, this._token)
            },
            show: async (): Promise<void> => {
                await callApi({
                    method: "patch",
                    url: this._url.vield(this.id, field.id),
                }, this._token)
            }
        }))
    }
    async rows(limit?: number, offset?: number): Promise<Row[]> {
        const { nodes } = await callApi({
            method: "get",
            url: this._url.row(this.tableId),
            params: { limit, offset }
        }, this._token)
        return nodes.map(row => new RowImpl({ jwtToken: this._token, url: this._url, parentId: this.tableId, rowId: row.id }))
    }
    async row(rowId: string): Promise<Row> {
        const row = await callApi({
            method: "get",
            url: this._url.row(this.tableId, rowId)
        }, this._token)
        return new RowImpl({ jwtToken: this._token, url: this._url, parentId: this.tableId, rowId: row.id })
    }
    async addRow(): Promise<string> {
        const { id } = await callApi({
            method: "post",
            url: this._url.row(this.tableId)
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
class TableImpl implements Table {
    id;
    name: APITable['name'];
    _fields: APIField<keyof Types>[];
    _url: UrlProjectPath;
    _token: string;
    constructor(params: APIView & { url: UrlProjectPath, jwtToken: string }) {
        this.id = params.id
        this._fields = params.vields
        this._url = params.url
        this._token = params.jwtToken
    }
    async addField(field: Types[keyTypes]): Promise<string> {
        const { id } = await callApi({
            method: "post",
            url: this._url.field(this.id),
            data: field
        }, this._token)
        return id
    }
    async fields(): Promise<Field[]> {
        return this._fields.map(field => ({
            ...field,
            delete: async (): Promise<void> => {
                await callApi({
                    method: "delete",
                    url: this._url.field(this.id, field.id),
                }, this._token)
            },
            update: async (field: Partial<Types[keyTypes]>): Promise<void> => {
                await callApi({
                    method: "patch",
                    url: this._url.field(this.id, field.id),
                    data: field
                }, this._token)
            }
        }))
    }
    async field(id: string): Promise<Field> {
        const field = this._fields.find(v => v.id === id)
        if (!field) throw new Error('Field not found')
        return {
            ...field,
            delete: async (): Promise<void> => {
                await callApi({
                    method: "delete",
                    url: this._url.field(this.id, field.id),
                }, this._token)
            },
            update: async (field: Partial<Types[keyTypes]>): Promise<void> => {
                await callApi({
                    method: "patch",
                    url: this._url.field(this.id, field.id),
                    data: field
                }, this._token)
            }
        }
    }
    async rows(limit?: number, offset?: number): Promise<Row[]> {
        const { nodes } = await callApi({
            method: "get",
            url: this._url.row(this.id),
            params: { limit, offset }
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
    async update(table: Partial<Omit<APITable, "id">>): Promise<void> {
        await callApi({
            method: "patch",
            url: this._url.row(this.id),
            data: table
        }, this._token)
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
        table(id?: string) {
            if (!id) return "/tables"
            return url.project() + "/tables/" + id
        },
        field(tableId: string, fieldId?: string) {
            const tableUrl = url.table(tableId)
            const fieldUrl = tableUrl + "/fields"
            if (!fieldId) return fieldUrl
            return fieldUrl + "/" + fieldId
        },
        vield(viewId: string, fieldId?: string) {
            const viewUrl = url.view(viewId)
            const fieldUrl = viewUrl + "/fields"
            if (!fieldId) return fieldUrl
            return fieldUrl + "/" + fieldId
        },
        row(tableId: string, rowId?: string) {
            const viewUrl = url.table(tableId)
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
export default (config: ProjectConfig) => {
    const url: UrlProjectPath = generateUrlProjectPath(config)
    let jwtToken;
    return {
        createTable: async (params: Omit<APITable, "id" | "fields"> & { fields: Omit<APIField<keyTypes>, "id">[] }): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.table(),
                data: params
            }, jwtToken)
            return id
        },
        tables: async (limit?: number, offset?: number): Promise<Table[]> => {
            const views = await callApi({
                method: "post",
                url: url.table(),
                params: { limit, offset }
            }, jwtToken)
            return views.map(view => new TableImpl({ ...view, jwtToken, url }))
        },
        table: async (id: string): Promise<Table> => {
            const view = await callApi({
                method: "post",
                url: url.table(id)
            }, jwtToken)
            return new TableImpl({ ...view, jwtToken, url })
        },
        createView: async (params: Omit<APIView, "id" | "vields"> & { vields: string[] }): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.view(),
                data: params
            }, jwtToken)
            return id
        },
        views: async (limit?: number, offset?: number): Promise<View[]> => {
            const views = await callApi({
                method: "post",
                url: url.view(),
                params: { limit, offset }
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
                jwtToken = 'Bearer ' + token
            },
            signOut() { jwtToken = undefined },
            token() { return jwtToken }
        },
        createRole: async (params: Omit<APIRole, "id">): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.role(),
                data: params
            }, jwtToken)
            return id
        },
        roles: async (limit?: number, offset?: number): Promise<Role[]> => {
            const { nodes } = await callApi({
                method: "get",
                url: url.role(),
                params: { limit, offset }
            }, jwtToken)
            return nodes.map(role => new RoleImpl({ ...role, jwtToken, url }))
        },
        role: async (roleId: string): Promise<Role> => {
            const role = await callApi({
                method: "get",
                url: url.role(roleId)
            }, jwtToken)
            return new RoleImpl({ ...role, jwtToken, url })
        },
        createMember: async (params: { email: string, roleId?: string }): Promise<string> => {
            const { id } = await callApi({
                method: "post",
                url: url.member(),
                data: params
            }, jwtToken)
            return id
        },
        members: async (limit?: number, offset?: number): Promise<Member[]> => {
            const { nodes } = await callApi({
                method: "get",
                url: url.member(),
                params: { limit, offset }
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