import { BaseField } from "./baseField";

export type RollupField = BaseField & {
  type: "rollup";
  source: string;
  destinations: string[];
  condition?: string;
  aggregate: "sum" | "count" | "min" | "max" | "avg";
  materialize: boolean;
};
