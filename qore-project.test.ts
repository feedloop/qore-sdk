import QoreProject from './qore-project'
const mockOrgId = "feedloop-123"
const mockProjectId = "demo-123"
function getQoreProject() {
    return QoreProject({ organizationId: mockOrgId, projectId: mockProjectId })
}
describe('Qore Project', () => {
    describe('Member', () => {
        it('should create member', async () => {
            const client = getQoreProject()
            expectAsync(client.createMember({
                "email": "doni@feedloop.io",
                "roleId": "admin-123"
            })).toBeResolvedTo("project-doni-123")
        })
        it('should list member', async () => {
            const client = getQoreProject()
            const nodes = await client.members()
            expect(nodes.length).toBeGreaterThan(1)
        })
        it('should delete member', async () => {
            const client = getQoreProject()
            const [node] = await client.members()
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update role member', async () => {
            const client = getQoreProject()
            const [node] = await client.members()
            expectAsync(node.updateRole("admin-123")).toBeResolved()
        })
    })
    describe('Roles', () => {
        it('should create role', async () => {
            const client = getQoreProject()
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
            const nodes = await client.roles()
            expect(nodes.length).toBeGreaterThan(1)
        })
        it('should delete role', async () => {
            const client = getQoreProject()
            const [node] = await client.roles()
            expectAsync(node.delete()).toBeResolved()
        })
        it('should update role', async () => {
            const client = getQoreProject()
            const [node] = await client.roles()
            expectAsync(node.update({
                name: "test"
            })).toBeResolved()
        })
    })
})