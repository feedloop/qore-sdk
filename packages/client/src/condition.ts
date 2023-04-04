export const binaryOps = {
  equal: "$eq",
  notEqual: "$ne",
  greaterThan: "$gt",
  greaterThanOrEqual: "$gte",
  lessThan: "$lt",
  lessThanOrEqual: "$lte",
  like: "$like",
  ilike: "$ilike",
  in: "$in",
  notIn: "$nin",
  regexp: "$re",
  fullText: "$fulltext"
} as const;
export const chainableLogicalOps = {
  and: "$and",
  or: "$or"
} as const;
export const logicalOps = {
  ...chainableLogicalOps,
  not: "$not"
} as const;

type Value = string | number | boolean | null;

type BinaryOperator = keyof typeof binaryOps;
type BinaryOperatorValue = typeof binaryOps[BinaryOperator];
type ChainableLogicalOperator = keyof typeof chainableLogicalOps;
type LogicalOperator = keyof typeof logicalOps;
type LogicalOperatorValue = typeof logicalOps[LogicalOperator];

type NAryExpression = {
  [key in LogicalOperator]: Expression[];
};
type BinaryExpression = {
  [key in string]: {
    [key in BinaryOperatorValue]: Value;
  };
};
export type Expression = NAryExpression | BinaryExpression;

export type ToString = () => string;

export type BinaryBuilder = {
  [key in BinaryOperator]: (value: Value | ToString) => ChainableLogicalBuilder;
};
export type ChainableLogicalBuilder = {
  [key in ChainableLogicalOperator]: (
    ...builders: ChainableLogicalBuilder[]
  ) => ChainableLogicalBuilder;
} &
  (() => Expression);
export type LogicalBuilder = {
  [key in LogicalOperator]: (
    ...builders: ChainableLogicalBuilder[]
  ) => ChainableLogicalBuilder;
};
export type ConditionBuilder = Record<
  string,
  {
    [key in BinaryOperator]: (value: any) => ChainableLogicalBuilder;
  }
>;

export const fromEntries = <K extends string, V>(
  entries: Iterable<[K, V]>
): { [key in K]: V } =>
  // @ts-ignore -- typescript Object.fromEntries doesn't support generic key type
  Object.fromEntries(entries);
export const keys = <K extends string>(obj: { [key in K]: any }): K[] =>
  // @ts-ignore -- typescript Object.keys doesn't support generic key type
  Object.keys(obj);

const createChainableLogicalBuilder = (
  expression: Expression
): ChainableLogicalBuilder => {
  const logicalBuilder = (() => expression) as ChainableLogicalBuilder;
  for (const op of keys(chainableLogicalOps)) {
    const operator: LogicalOperatorValue = logicalOps[op as LogicalOperator];
    logicalBuilder[op as LogicalOperator] = (
      ...builders: ChainableLogicalBuilder[]
    ) => {
      const expressions = builders.map(builder => builder());
      const newExpression = {
        [operator]: [expression, ...expressions]
      } as NAryExpression;
      return createChainableLogicalBuilder(newExpression);
    };
  }
  return logicalBuilder;
};

export const logicalBuilder: LogicalBuilder = fromEntries(
  keys(logicalOps).map((op): [
    LogicalOperator,
    LogicalBuilder[LogicalOperator]
  ] => [
    op,
    (...builders: ChainableLogicalBuilder[]) => {
      const expressions = builders.map(builder => builder());
      return createChainableLogicalBuilder({
        [logicalOps[op as LogicalOperator]]: expressions
      } as NAryExpression);
    }
  ])
);

const createBinaryBuilder = (field: string): BinaryBuilder =>
  fromEntries(
    keys(binaryOps).map(op => [
      op,
      value => {
        const expression = {
          [field]: {
            [binaryOps[op]]: typeof value === "function" ? value() : value
          } as BinaryExpression[string]
        };
        return createChainableLogicalBuilder(expression);
      }
    ])
  );

export const createConditionBuilder = (): ConditionBuilder => {
  return new Proxy(
    {},
    {
      get: (target: any, prop: string) => {
        return createBinaryBuilder(prop);
      }
    }
  );
};
