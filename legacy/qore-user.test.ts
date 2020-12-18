import QoreUser from "./qore-user";
const mockOrgId = "feedloop-123";
const mockUsername = "gg@gg.co";
const mockPw = "xxx";
const mockProject = "demo-123";
describe("Qore User", () => {
  describe("Public", () => {
    it("should register new user", async () => {
      const client = QoreUser();
      await expectAsync(
        client.register({
          name: "rama",
          email: "gg@gg.co",
          password: "xxx"
        })
      ).toBeResolved();
      expect(client.user()).toEqual({
        id: "rama-123",
        token: "userToken",
        email: "gg@gg.co",
        name: "rama"
      });
    });
    it("should return user token", async () => {
      const client = QoreUser();
      await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
      expect(client.user()).toEqual({
        id: "rama-123",
        token: "userToken",
        email: "gg@gg.co",
        name: "rama"
      });
    });
  });
  describe("Logged in", () => {
    describe("Organization", () => {
      it("should create new organization", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        expectAsync(
          client.createOrganization({
            name: "feedloop",
            category: "telco",
            size: "10-50"
          })
        ).toBeResolvedTo(mockOrgId);
      });
      it("should failed to create new organization without login", async () => {
        const client = QoreUser();
        expectAsync(
          client.createOrganization({
            name: "feedloop",
            category: "telco",
            size: "10-50"
          })
        ).toBeRejected();
      });
      it("should get organization", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        expect(org.id).toEqual(mockOrgId);
      });
      it("should list organization", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const orgs = await client.organizations();
        expect(orgs.length).toBeGreaterThan(1);
      });
      it("should delete organization", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        expectAsync(org.delete()).toBeResolved();
      });
      it("should update organization name", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        expectAsync(
          org.update({
            name: "new-feedloop",
            size: "5-10",
            category: "media"
          })
        ).toBeResolved();
      });
    });
    describe("Account", () => {
      it("should invite account", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        expectAsync(
          org.inviteAccount({
            email: "rizqi@feedloop.io",
            type: "admin"
          })
        ).toBeResolved();
      });
      it("should list account", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const accs = await org.accounts();
        expect(accs.length).toBeGreaterThan(1);
      });
      it("should remove account", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const [acc] = await org.accounts();
        expectAsync(acc.delete()).toBeResolved();
      });
      it("should update account type", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const [acc] = await org.accounts();
        expectAsync(acc.updateType("normal")).toBeResolved();
      });
    });
    describe("Project", () => {
      it("should create project", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        expectAsync(
          org.createProject({
            name: "demo"
          })
        ).toBeResolvedTo("demo-123");
      });
      it("should list project", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const nodes = await org.projects();
        expect(nodes.length).toBeGreaterThan(1);
      });
      it("should get project", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const project = await org.project(mockProject);
        expect(project.id).toEqual(mockProject);
      });
      it("should delete project", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const project = await org.project(mockProject);
        expectAsync(project.delete()).toBeResolved();
      });
      it("should update project", async () => {
        const client = QoreUser();
        await expectAsync(client.login(mockUsername, mockPw)).toBeResolved();
        const org = await client.organization(mockOrgId);
        const project = await org.project(mockProject);
        expectAsync(
          project.update({
            name: "new-demo"
          })
        ).toBeResolved();
      });
    });
  });
});
