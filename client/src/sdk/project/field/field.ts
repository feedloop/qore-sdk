import { ActionField } from './actionField';
import { BooleanField } from './booleanField';
import { DateField } from './dateField';
import { FormulaField } from './formulaField';
import { LookupField } from './lookupField';
import { NumberField } from './numberField';
import { PasswordField } from './passwordField';
import { RelationField } from './relationField';
import { RoleField } from './roleField';
import { RollupField } from './rollupField';
import { SelectField } from './selectField';
import { TextField } from './textField';

export type Fields = {
  text: TextField;
  number: NumberField;
  date: DateField;
  rollup: RollupField;
  lookup: LookupField;
  relation: RelationField;
  select: SelectField;
  formula: FormulaField;
  action: ActionField;
  boolean: BooleanField;
  role: RoleField;
  password: PasswordField;
};

export type FieldType = keyof Fields;

export type APIField<T extends FieldType = FieldType> = Fields[T];
