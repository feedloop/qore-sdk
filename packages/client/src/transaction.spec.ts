import { transaction } from "./transaction";

describe("Transaction Builder", () => {
  test("independent operations", () => {
    expect(
      transaction(tx => {
        const user = tx.users.select().where(({ name }) => name.equal("test"));
        const comments = tx.comments.insert({ content: "test" });
        return { user, comments };
      })
    ).toMatchInlineSnapshot(`
      {
        "returns": {
          "comments": "operation1",
          "user": "operation0",
        },
        "transactions": [
          {
            "instruction": {
              "condition": {
                "name": {
                  "$eq": "test",
                },
              },
              "name": "operation0",
              "table": "users",
            },
            "operation": "Select",
          },
          {
            "instruction": {
              "data": {
                "content": "test",
              },
              "name": "operation1",
              "table": "comments",
            },
            "operation": "Insert",
          },
        ],
      }
    `);
  });

  test("dependent operation", () => {
    expect(
      transaction(tx => {
        const user = tx.users.select().where(({ name }) => name.equal("test"));
        tx.users.select(["id"]).where(({ id }) => id.equal(user.result[0].id));
        const comments = tx.comments.insert({ content: "test", user });
        return comments;
      })
    ).toMatchInlineSnapshot(`
      {
        "returns": "operation2",
        "transactions": [
          {
            "instruction": {
              "condition": {
                "name": {
                  "$eq": "test",
                },
              },
              "name": "operation0",
              "table": "users",
            },
            "operation": "Select",
          },
          {
            "instruction": {
              "condition": {
                "id": {
                  "$eq": "{{operation0[0].id}}",
                },
              },
              "fields": [
                "id",
              ],
              "name": "operation1",
              "table": "users",
            },
            "operation": "Select",
          },
          {
            "instruction": {
              "data": {
                "content": "test",
                "user": "{{operation0}}",
              },
              "name": "operation2",
              "table": "comments",
            },
            "operation": "Insert",
          },
        ],
      }
    `);
  });

  test("dynamic property getter", () => {
    expect(
      transaction(tx => {
        const user = tx.users.select().where(({ name }) => name.equal("test"));
        const comments = tx.comments.insert({
          content: "test",
          user_id: user.result.id,
          address: user.result.comments[0].address
        });
        return comments;
      })
    ).toMatchInlineSnapshot(`
      {
        "returns": "operation1",
        "transactions": [
          {
            "instruction": {
              "condition": {
                "name": {
                  "$eq": "test",
                },
              },
              "name": "operation0",
              "table": "users",
            },
            "operation": "Select",
          },
          {
            "instruction": {
              "data": {
                "address": "{{operation0.comments[0].address}}",
                "content": "test",
                "user_id": "{{operation0.id}}",
              },
              "name": "operation1",
              "table": "comments",
            },
            "operation": "Insert",
          },
        ],
      }
    `);
  });
});
