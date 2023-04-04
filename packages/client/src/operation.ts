import {
  ConditionBuilder,
  Expression,
  ChainableLogicalBuilder,
  createConditionBuilder,
  LogicalBuilder,
  logicalBuilder
} from "./condition";

export type SelectOperation = {
  operation: "Select";
  instruction: {
    name?: string;
    table: string;
    select?: string[];
    populate?: string[];
    orderBy?: string[];
    condition?: Expression;
  };
};

export type InsertOperation = {
  operation: "Insert";
  instruction: {
    name?: string;
    table: string;
    data: Record<string, any>;
  };
};

export type UpdateOperation = {
  operation: "Update";
  instruction: {
    name?: string;
    table: string;
    condition?: Expression;
    set: Record<string, any>;
  };
};

export type DeleteOperation = {
  operation: "Delete";
  instruction: {
    name?: string;
    table: string;
    condition?: Expression;
  };
};

export type Operation =
  | SelectOperation
  | InsertOperation
  | UpdateOperation
  | DeleteOperation;

export type SelectTableQueryBuilder = {
  instruction: SelectOperation["instruction"];
  populate: (fields: string[]) => SelectTableQueryBuilder;
  orderBy: (fields: string[]) => SelectTableQueryBuilder;
  where: (
    builderFn: (
      builder: ConditionBuilder,
      operations: LogicalBuilder
    ) => ChainableLogicalBuilder
  ) => SelectTableQueryBuilder;
  build: () => SelectOperation;
};

export type InsertTableQueryBuilder = {
  instruction: InsertOperation["instruction"];
  build: () => InsertOperation;
};

export type UpdateTableQueryBuilder = {
  instruction: UpdateOperation["instruction"];
  where: (
    builderFn: (
      builder: ConditionBuilder,
      operations: LogicalBuilder
    ) => ChainableLogicalBuilder
  ) => UpdateTableQueryBuilder;
  build: () => UpdateOperation;
};

export type DeleteTableQueryBuilder = {
  instruction: DeleteOperation["instruction"];
  where: (
    builderFn: (
      builder: ConditionBuilder,
      operations: LogicalBuilder
    ) => ChainableLogicalBuilder
  ) => DeleteTableQueryBuilder;
  build: () => DeleteOperation;
};

export type TableQueryBuilder =
  | SelectTableQueryBuilder
  | InsertTableQueryBuilder
  | UpdateTableQueryBuilder
  | DeleteTableQueryBuilder;

const evaluateJsonFunction = (value: any) => {
  if (typeof value === "function") {
    return `{{${value()}}}`;
  }
  if (Array.isArray(value)) {
    return value.map(v => evaluateJsonFunction(v));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        evaluateJsonFunction(val)
      ])
    );
  }
  return value;
};

export const select = (
  table: string,
  fields: "*" | string[] = "*"
): SelectTableQueryBuilder => {
  const instruction: SelectOperation["instruction"] = {
    table,
    name: "data"
  };
  if (Array.isArray(fields)) {
    instruction.select = fields;
  }
  const builder: SelectTableQueryBuilder = {
    instruction,
    populate: fields => {
      instruction.populate = fields;
      return builder;
    },
    orderBy: fields => {
      instruction.orderBy = fields;
      return builder;
    },
    where: builderFn => {
      const conditionBuilder = createConditionBuilder();
      instruction.condition = builderFn(conditionBuilder, logicalBuilder)();
      return builder;
    },
    build: () => {
      return {
        operation: "Select",
        instruction
      };
    }
  };
  return builder;
};

export const insert = (
  table: string,
  data: Record<string, any>
): InsertTableQueryBuilder => {
  const instruction = {
    table,
    name: "data",
    data: evaluateJsonFunction(data)
  };
  const builder: InsertTableQueryBuilder = {
    instruction,
    build: () => {
      return {
        operation: "Insert",
        instruction
      };
    }
  };
  return builder;
};

export const update = (
  table: string,
  data: Record<string, any>
): UpdateTableQueryBuilder => {
  const instruction: UpdateOperation["instruction"] = {
    table,
    name: "data",
    set: evaluateJsonFunction(data)
  };
  const builder: UpdateTableQueryBuilder = {
    instruction,
    where: builderFn => {
      const conditionBuilder = createConditionBuilder();
      instruction.condition = builderFn(conditionBuilder, logicalBuilder)();
      return builder;
    },
    build: () => {
      return {
        operation: "Update",
        instruction
      };
    }
  };
  return builder;
};

export const del = (table: string): DeleteTableQueryBuilder => {
  const instruction: DeleteOperation["instruction"] = {
    table,
    name: "data"
  };
  const builder: DeleteTableQueryBuilder = {
    instruction,
    where: builderFn => {
      const conditionBuilder = createConditionBuilder();
      instruction.condition = builderFn(conditionBuilder, logicalBuilder)();
      return builder;
    },
    build: () => {
      return {
        operation: "Delete",
        instruction
      };
    }
  };
  return builder;
};
