import { BaseField } from "./baseField";

export type Parameter = {
  slug: string;
  type: string;
  required: boolean;
};

export type InsertTask = {
  type: "insert";
  table: string;
  insert: { [key: string]: string };
};
export type UpdateTask = {
  type: "update";
  update: { [key: string]: string };
};
export type Task = InsertTask | UpdateTask;

export type ActionField = BaseField & {
  type: "action";
  parameters: Parameter[];
  condition?: string;
  tasks: Task[];
};
