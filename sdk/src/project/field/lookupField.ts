import { BaseField } from './baseField';

export type LookupField = BaseField & {
  type: 'lookup';
  source: string;
  destinations: string[];
  returnType?: string;
  multiple: boolean;
};
