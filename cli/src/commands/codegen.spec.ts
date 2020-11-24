import { expect, test } from "@oclif/test";

const schema = {
  tables: [
    {
      name: "member",
      type: "auth",
      id: "member",
      fields: [
        {
          name: "email",
          type: "text",
          id: "email",
        },
        {
          name: "role",
          type: "role",
          id: "role",
        },
        {
          name: "action",
          type: "action",
          id: "action",
          parameters: [
            {
              slug: "param1",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
  roles: [
    {
      id: "tO3WLmWNGoIiILG",
      name: "admin",
      isAdmin: true,
    },
  ],
  forms: [
    {
      name: "form1",
      id: "form1",
      tableId: "member",
      fields: [
        {
          required: true,
          id: "email",
        },
        {
          hidden: true,
          required: true,
          id: "role",
        },
      ],
    },
  ],
  views: [
    {
      id: "view1",
      name: "view1",
      tableId: "member",
      parameters: [
        {
          slug: "param1",
          type: "text",
        },
      ],
      sorts: [
        {
          by: "email",
          order: "desc",
        },
      ],
      fields: [
        {
          name: "email",
          type: "text",
          id: "email",
        },
        {
          name: "role",
          type: "role",
          id: "role",
        },
        {
          name: "action",
          type: "action",
          id: "action",
          parameters: [
            {
              slug: "param1",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
};

describe.only("codegen", () => {
  test
    .nock("https://qore-api.feedloop.io", (api) =>
      api
        .get("/orgs/some-organization/projects/some-project/schema")
        .reply(200, schema)
    )
    .stdout()
    .command(["codegen", "--project=some-project", "--org=some-organization"])
    .it("notify successful login", (ctx) => {
      expect(ctx.stdout).to.equal(`
type MemberTable = {
  fields: {
    email: text;
    role: role;
    action: action;
  }
}

type View1View = {
  table: MemberTable;
  fields: {
    email: text;
    role: role;
    action: action;
  }
}
`);
    });
});
