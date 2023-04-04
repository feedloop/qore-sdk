import mockAxios from "jest-mock-axios";
import { connect, createClient } from "./client";
import schemaAdmin from "./mocks/schema_admin.json";
import schemaUser from "./mocks/schema_user.json";
import schemaPublic from "./mocks/schema_public.json";

const client = createClient({
  url: "http://localhost:8080",
  schema: schemaAdmin,
  adminSecret: "admin"
});
const headers = {
  "Content-Type": "application/json"
};

describe("Client", () => {
  afterEach(() => {
    mockAxios.reset();
  });

  test("connect", async () => {
    const promise = connect("http://localhost:8080", { adminSecret: "admin" });
    expect(mockAxios.get).toHaveBeenCalledWith("/v1/schema");
    mockAxios.mockResponseFor({ url: "/v1/schema" }, { data: schemaAdmin });
    const client = await promise;
    const tables = client.tables();
    const views = client.views();
    const insights = client.insights();
    const queries = client.queries();
    expect(tables.map(table => table.name)).toEqual(["foo", "foo_2"]);
    expect(views.map(view => view.name)).toEqual([
      "foo_grid",
      "foo_name_grid",
      "mala_saved_filter",
      "filter_date_before"
    ]);
    expect(insights.map(insight => insight.name)).toEqual([
      "timeseries_foo",
      "one_insight_foo"
    ]);
    expect(queries.map(query => query.name)).toEqual(["editor_dua", "cobaah"]);
  });

  test('select "foo" table', async () => {
    const promise = client
      .table("foo")
      .select("*")
      .where(({ id, name }) => id.equal(1).and(name.equal("bar")))
      .exec();
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/v1/execute",
      {
        operations: [
          {
            operation: "Select",
            instruction: {
              name: "data",
              table: "foo",
              condition: {
                $and: [
                  {
                    id: {
                      $eq: 1
                    }
                  },
                  {
                    name: {
                      $eq: "bar"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      { headers }
    );
    mockAxios.mockResponseFor(
      { url: "/v1/execute" },
      { data: { results: [{ foo: "bar" }] } }
    );
    await promise;
  });

  test('insert "foo" table', async () => {
    const promise = client.table("foo").insert({ name: "bar" }).exec();
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/v1/execute",
      {
        operations: [
          {
            operation: "Insert",
            instruction: {
              name: "data",
              table: "foo",
              data: {
                name: "bar"
              }
            }
          }
        ]
      },
      { headers }
    );
    mockAxios.mockResponseFor(
      { url: "/v1/execute" },
      { data: { results: [{ id: 1 }] } }
    );
    await promise;
  });

  test('update "foo" table', async () => {
    const promise = client
      .table("foo")
      .update({ name: "bar" })
      .where(({ id }) => id.equal(1))
      .exec();
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/v1/execute",
      {
        operations: [
          {
            operation: "Update",
            instruction: {
              name: "data",
              table: "foo",
              condition: {
                id: {
                  $eq: 1
                }
              },
              set: {
                name: "bar"
              }
            }
          }
        ]
      },
      { headers }
    );
    mockAxios.mockResponseFor(
      { url: "/v1/execute" },
      { data: { results: [{ id: 1 }] } }
    );
    await promise;
  });

  test('delete "foo" table', async () => {
    const promise = client
      .table("foo")
      .delete()
      .where(({ id }) => id.equal(1))
      .exec();
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/v1/execute",
      {
        operations: [
          {
            operation: "Delete",
            instruction: {
              name: "data",
              table: "foo",
              condition: {
                id: {
                  $eq: 1
                }
              }
            }
          }
        ]
      },
      { headers }
    );
    mockAxios.mockResponseFor(
      { url: "/v1/execute" },
      { data: { results: [{ id: 1 }] } }
    );
    await promise;
  });

  test("transaction", async () => {
    const promise = client.execute(tx => {
      const user = tx.users.select().where(({ name }) => name.equal("test"));
      const comments = tx.comments.insert({
        content: "test",
        user_id: user.result.id,
        address: user.result.comments[0].address
      });
      return comments;
    });
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/v1/execute",
      {
        operations: [
          {
            instruction: {
              condition: {
                name: {
                  $eq: "test"
                }
              },
              name: "operation0",
              table: "users"
            },
            operation: "Select"
          },
          {
            instruction: {
              data: {
                address: "{{operation0.comments[0].address}}",
                content: "test",
                user_id: "{{operation0.id}}"
              },
              name: "operation1",
              table: "comments"
            },
            operation: "Insert"
          }
        ]
      },
      { headers }
    );
    mockAxios.mockResponseFor(
      { url: "/v1/execute" },
      { data: { results: [{ id: 1 }] } }
    );
    await promise;
  });
});
