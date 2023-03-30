import { createConditionBuilder, logicalBuilder } from "./condition";

describe("Condition Builder", () => {
  const conditionBuilder = createConditionBuilder();
  test("binary operator", () => {
    const { id } = conditionBuilder;
    expect(id.equal(1)()).toMatchInlineSnapshot(`
      {
        "id": {
          "$eq": 1,
        },
      }
    `);
  });

  test("logical operator", () => {
    const { and, or, not } = logicalBuilder;
    expect(
      and(conditionBuilder.id.equal(1), conditionBuilder.name.equal("test"))()
    ).toMatchInlineSnapshot(`
      {
        "$and": [
          {
            "id": {
              "$eq": 1,
            },
          },
          {
            "name": {
              "$eq": "test",
            },
          },
        ],
      }
    `);
    expect(not(conditionBuilder.id.equal(1))()).toMatchInlineSnapshot(`
      {
        "$not": [
          {
            "id": {
              "$eq": 1,
            },
          },
        ],
      }
    `);
    expect(or()()).toMatchInlineSnapshot(`
      {
        "$or": [],
      }
    `);
  });

  test("binary operators and logical operator", () => {
    const { id, name } = conditionBuilder;
    expect(id.equal(1).and(name.equal("test"))()).toMatchInlineSnapshot(`
      {
        "$and": [
          {
            "id": {
              "$eq": 1,
            },
          },
          {
            "name": {
              "$eq": "test",
            },
          },
        ],
      }
    `);
  });

  test("binary operators and multiple logical operator parameters", () => {
    const { id, name } = conditionBuilder;
    expect(id.equal(1).and(name.equal("test"), id.equal(2))())
      .toMatchInlineSnapshot(`
      {
        "$and": [
          {
            "id": {
              "$eq": 1,
            },
          },
          {
            "name": {
              "$eq": "test",
            },
          },
          {
            "id": {
              "$eq": 2,
            },
          },
        ],
      }
    `);
  });
});
