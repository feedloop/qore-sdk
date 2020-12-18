import { BaseField } from "./baseField";

export type FileField = BaseField & { type: "file"; fileType: string };
