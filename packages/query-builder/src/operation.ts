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
  build: () => InsertOperation;
};

export type UpdateTableQueryBuilder = {
  where: (
    builderFn: (
      builder: ConditionBuilder,
      operations: LogicalBuilder
    ) => ChainableLogicalBuilder
  ) => UpdateTableQueryBuilder;
  build: () => UpdateOperation;
};

export type DeleteTableQueryBuilder = {
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

type QoreTable = {
  select: (fields: string[]) => SelectTableQueryBuilder;
  insert: (data: Record<string, any>) => InsertTableQueryBuilder;
  update: (data: Record<string, any>) => UpdateTableQueryBuilder;
  delete: () => DeleteTableQueryBuilder;
};

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
    table
  };
  if (Array.isArray(fields)) {
    instruction.select = fields;
  }
  const builder: SelectTableQueryBuilder = {
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
    data: evaluateJsonFunction(data)
  };
  const builder: InsertTableQueryBuilder = {
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
    set: evaluateJsonFunction(data)
  };
  const builder: UpdateTableQueryBuilder = {
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
    table
  };
  const builder: DeleteTableQueryBuilder = {
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

export const table = (name: string): QoreTable => {
  const builder: QoreTable = {
    select: fields => select(name, fields),
    insert: data => insert(name, data),
    update: data => update(name, data),
    delete: () => del(name)
  };
  return builder;
};
