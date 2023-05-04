import { del, insert, select, update } from "./operation";

describe("Operation Builder", () => {
  test("select query builder", () => {
    expect(select("users").build()).toMatchInlineSnapshot(`
      {
        "instruction": {
          "name": "data",
          "table": "users",
        },
        "operation": "Select",
      }
    `);

    expect(select("users", ["id", "name"]).build()).toMatchInlineSnapshot(`
      {
        "instruction": {
          "name": "data",
          "select": [
            "id",
            "name",
          ],
          "table": "users",
        },
        "operation": "Select",
      }
    `);
  });

  test("select query builder with condition", () => {
    expect(
      select("users", ["id", "name"])
        .where(({ id, newId }) => id.equal(1))
        .build()
    ).toMatchInlineSnapshot(`
      {
        "instruction": {
          "condition": {
            "id": {
              "$eq": 1,
            },
          },
          "name": "data",
          "select": [
            "id",
            "name",
          ],
          "table": "users",
        },
        "operation": "Select",
      }
    `);
  });

  test("insert query builder", () => {
    expect(insert("users", { name: "test" }).build()).toMatchInlineSnapshot(`
      {
        "instruction": {
          "data": {
            "name": "test",
          },
          "name": "data",
          "table": "users",
        },
        "operation": "Insert",
      }
    `);
  });

  test("update query builder", () => {
    expect(update("users", { name: "test" }).build()).toMatchInlineSnapshot(`
      {
        "instruction": {
          "name": "data",
          "set": {
            "name": "test",
          },
          "table": "users",
        },
        "operation": "Update",
      }
    `);

    expect(
      update("users", { name: "test" })
        .where(({ id }) => id.equal(1).or(id.equal(2)))
        .build()
    ).toMatchInlineSnapshot(`
      {
        "instruction": {
          "condition": {
            "$or": [
              {
                "id": {
                  "$eq": 1,
                },
              },
              {
                "id": {
                  "$eq": 2,
                },
              },
            ],
          },
          "name": "data",
          "set": {
            "name": "test",
          },
          "table": "users",
        },
        "operation": "Update",
      }
    `);
  });

  test("delete query builder", () => {
    expect(del("users").build()).toMatchInlineSnapshot(`
      {
        "instruction": {
          "name": "data",
          "table": "users",
        },
        "operation": "Delete",
      }
    `);

    expect(
      del("users")
        .where(({ id }) => id.equal(1).or(id.equal(2)))
        .build()
    ).toMatchInlineSnapshot(`
      {
        "instruction": {
          "condition": {
            "$or": [
              {
                "id": {
                  "$eq": 1,
                },
              },
              {
                "id": {
                  "$eq": 2,
                },
              },
            ],
          },
          "name": "data",
          "table": "users",
        },
        "operation": "Delete",
      }
    `);
  });
});
