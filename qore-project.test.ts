import QoreProject from './qore-project'
const mockOrgId = "feedloop-123"
const mockProjectId = "demo-123"
const mockUserToken = "userToken"
const mockTable = "voucher-123"
const mockView = "view-voucher-1"
const mockFirstRowId = "row-id-1"
function getQoreProject() {
    return QoreProject({ organizationId: mockOrgId, projectId: mockProjectId })
}

describe('Qore Project', () => {
    beforeAll(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });
    describe('Auth', () => {
        it('should login with user token', async () => {
            const client = getQoreProject()
            expectAsync(client.auth.signInWithUserToken(mockUserToken)).toBeResolved()
        })
        it('should logout', async () => {
            const client = getQoreProject()
            client.auth.signOut()
            expect(client.auth.token()).toBeUndefined()
        })
    })
    describe('Member', () => {
        it('should create member', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            expectAsync(client.createMember({
                "email": "doni@feedloop.io",
                "roleId": "admin-123"
            })).toBeResolvedTo("project-doni-123")
        })
        it('should list member', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const nodes = await client.members()
            expect(nodes.length).toBeGreaterThan(1)
        })
        it('should delete member', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.members()
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update role member', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.members()
            expectAsync(node.updateRole("admin-123")).toBeResolved()
        })
        it('should update role member', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.members()
            expectAsync(node.updateRole("admin-123")).toBeResolved()
        })
    })
    describe('Roles', () => {
        it('should create role', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            expectAsync(client.createRole({
                "name": "editor",
                "permissions": [
                    "tableWrite",
                    "tableExecute",
                    "tableRead",
                    "view"
                ]
            })).toBeResolvedTo("editor-123")
        })
        it('should list role', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const nodes = await client.roles()
            expect(nodes.length).toBeGreaterThan(1)
        })
        it('should delete role', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.roles()
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update role', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.roles()
            expectAsync(node.update({
                name: "test"
            })).toBeResolved()
        })
    })
    describe('Table', () => {
        it('should create table', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            expectAsync(client.createTable({
                "name": "voucher",
                "fields": [
                    {
                        "name": "serialCode",
                        "type": "text" as 'text',
                    },
                    {
                        "name": "issueDate",
                        "type": "date",
                    },
                    {
                        "name": "discountPercentage",
                        "type": "number",
                    },
                    {
                        "name": "discountNominal",
                        "type": "number"
                    },
                    {
                        "name": "expirationDate",
                        "type": "date",
                    }
                ]
            })).toBeResolvedTo(mockTable)
        })
        it('should list table', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.tables()
            expect(node.id).toEqual(mockTable)
        })
        it('should get table', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.table(mockTable)
            expect(node.id).toEqual(mockTable)
        })
        it('should delete table', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.table(mockTable)
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update table name', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.table(mockTable)
            expectAsync(node.update({
                name: "new-voucher-123"
            })).toBeResolved()
        })
        describe('Fields', () => {
            it('should create fields', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                expectAsync(node.addField({
                    type: "text",
                    name: "name"
                })).toBeResolvedTo("name-123")
            })
            it('should list fields', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const [field] = await node.fields()
                expect(field.id).toEqual("serial-code-123")
            })
            it('should get field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const field = await node.field("serial-code-123")
                expect(field.id).toEqual("serial-code-123")
            })
            it('should delete field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const field = await node.field("serial-code-123")
                expectAsync(field.delete()).toBeResolved()
            })
            it('should update field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const field = await node.field("serial-code-123")
                expectAsync(field.update({
                    name: "newName"
                })).toBeResolved()
            })
        })
        describe('Rows', () => {
            it('should create row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                expectAsync(node.addRow({
                    "nameTxtField": "rama"
                })).toBeResolvedTo("row-id-1")
            })
            it('should list rows', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const rows = await node.rows()
                expect(rows.length).toBeGreaterThan(1)
            })
            it('should get row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expect(row.id).toEqual(mockFirstRowId)
            })
            it('should delete row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.delete()).toBeResolved()
            })
            it('should update row field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'text'>({ id: "nameTxtField", type: 'text' }).update("new-rama")).toBeResolved()
            })
            it('should update row field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'text'>({ id: "nameTxtField", type: 'text' }).update("new-rama")).toBeResolved()
            })
            it('should add row field relation', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'relation'>({ id: "testName", type: 'relation' }).add("row-id-3")).toBeResolved()
            })
            it('should delete row field relation', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.table(mockTable)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'relation'>({ id: "testName", type: 'relation' }).remove("row-id-3")).toBeResolved()
            })
        })
    })
    describe('View', () => {
        it('should create view', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            expectAsync(client.createView({
                name: "voucher-view",
                vields: ["testAction"],
                tableId: mockTable,
                filters: [
                    "status == 'active'",
                    "expirationDate > now()"
                ],
                sorts: [
                    {
                        "by": "expirationDate",
                        "order": "desc"
                    }
                ]
            })).toBeResolvedTo(mockTable)
        })
        it('should list view', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const [node] = await client.views()
            expect(node.id).toEqual(mockView)
        })
        it('should get view', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.view(mockView)
            expect(node.id).toEqual(mockView)
        })
        it('should delete view', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.view(mockView)
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update view', async () => {
            const client = getQoreProject()
            await client.auth.signInWithUserToken(mockUserToken)
            const node = await client.view(mockView)
            expectAsync(node.update({
                "name": "view-voucher-1",
                "tableId": "voucher-123",
                "vields": ["testAction"],
                "filters": [
                    "status == 'active'",
                    "expirationDate > now()"
                ],
                "sorts": [
                    {
                        "by": "expirationDate",
                        "order": "desc"
                    }
                ]
            })).toBeResolved()
        })
        describe('Vields', () => {
            it('should create vield', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                expectAsync(node.addVield({
                    type: "text",
                    name: "name"
                })).toBeResolvedTo("name-123")
            })
            it('should list vields', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const [field] = await node.vields()
                expect(field.id).toEqual("serial-code-123")
            })
            it('should hide field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockTable)
                const [vield] = await node.vields()
                expectAsync(vield.hide()).toBeResolved()
            })
            it('should show field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockTable)
                const [vield] = await node.vields()
                expectAsync(vield.show()).toBeResolved()
            })
        })
        describe('Rows', () => {
            it('should create row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                expectAsync(node.addRow({
                    "nameTxtField": "rama"
                })).toBeResolvedTo("row-id-1")
            })
            it('should list rows', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const rows = await node.rows()
                expect(rows.length).toBeGreaterThan(1)
            })
            it('should get row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expect(row.id).toEqual(mockFirstRowId)
            })
            it('should delete row', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.delete()).toBeResolved()
            })
            it('should update row field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'text'>({ id: "nameTxtField", type: 'text' }).update("new-rama")).toBeResolved()
            })
            it('should update row field', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'text'>({ id: "nameTxtField", type: 'text' }).update("new-rama")).toBeResolved()
            })
            it('should add row field relation', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'relation'>({ id: "testName", type: 'relation' }).add("row-id-3")).toBeResolved()
            })
            it('should delete row field relation', async () => {
                const client = getQoreProject()
                await client.auth.signInWithUserToken(mockUserToken)
                const node = await client.view(mockView)
                const row = await node.row(mockFirstRowId)
                expectAsync(row.col<'relation'>({ id: "testName", type: 'relation' }).remove("row-id-3")).toBeResolved()
            })
        })
    })
})