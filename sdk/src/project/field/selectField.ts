import { BaseField } from './baseField';

export type SelectField = BaseField & { type: 'select'; select: string[] };
