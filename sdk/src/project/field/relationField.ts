import { BaseField } from './baseField';

export type RelationField = BaseField & {
  type: 'relation';
  table: string;
  multiple: boolean;
};
