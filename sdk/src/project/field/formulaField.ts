import { BaseField } from './baseField';

export type FormulaField = BaseField & {
  type: 'formula';
  returnType: 'number';
  formula: string;
};
