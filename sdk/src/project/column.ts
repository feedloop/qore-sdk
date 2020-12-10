import { FieldType } from './field';

type RelationValue = { id: string; displayField: string };

export type Columns = {
  text: { value(): string; update(value?: string): Promise<void> };
  number: { value(): number; update(value?: number): Promise<void> };
  select: { value(): string; update(value?: string): Promise<void> };
  date: { value(): string; update(value?: string): Promise<void> };
  boolean: { value(): boolean; update(value?: boolean): Promise<void> };
  rollup: { value(): number };
  lookup: {
    value():
      | string
      | string[]
      | number
      | number[]
      | boolean
      | boolean[]
      | RelationValue
      | RelationValue[]
      | null;
  };
  relation: {
    value(): RelationValue[] | RelationValue | null;
    add(rowId: string): Promise<void>;
    remove(rowId: string): Promise<void>;
  };
  formula: { value(): any };
  action: { execute(params: { [key: string]: any }): Promise<void> };
  role: { value(): string; update(value?: string): Promise<void> };
  password: { value(): string; update(value?: string): Promise<void> };
  file: {
    value(): string;
    update(value?: string): Promise<void>;
    getUploadUrl(fileName: string): Promise<string>;
  };
  json: { value(): object; update(value?: object): Promise<void> };
};

export type Column<T extends FieldType = FieldType> = Columns[T];
