import { callApi } from '../../common';
import { ProjectConfig } from '../project';
import { APIRow, RowImpl, Rows } from '../row';
import { url } from '../url';
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

export type Field<T extends FieldType = FieldType> = APIField<T> & {
  delete(): Promise<void>;
  update(field: Omit<APIField<T>, 'id'>): Promise<void>;
} & (T extends 'relation'
    ? {
        refRows(qs: { limit?: number; offset?: number; q?: string }): Promise<Rows>;
      }
    : {});

export function buildRowField(params: {
  field: Field;
  config: ProjectConfig;
  rowId: string;
  tableId: string;
  row: APIRow;
}) {
  const { field, config, rowId, tableId, row } = params;
  const fieldId = field.id;
  switch (field.type) {
    case 'role':
    case 'select':
    case 'boolean':
    case 'date':
    case 'number':
    case 'password':
    case 'text':
      return {
        value() {
          return row[fieldId];
        },
        async update(value?: string | boolean | number | Date) {
          await callApi(
            {
              method: 'patch',
              url: url.row({ ...config, tableId, rowId }),
              data: {
                [fieldId]: value,
              },
            },
            config.token
          );
        },
      };
    case 'relation':
      return {
        value() {
          return row[fieldId];
        },
        async add(value: string) {
          await callApi(
            {
              method: 'post',
              url: url.addRowRelation({ ...config, tableId, rowId, fieldId }),
              data: { value },
            },
            config.token
          );
        },
        async remove(refRowId: string) {
          await callApi(
            {
              method: 'delete',
              url: url.removeRowRelation({
                ...config,
                tableId,
                rowId,
                fieldId,
                refRowId,
              }),
            },
            config.token
          );
        },
      };
    case 'action':
      return {
        async execute(parameters: { [key: string]: any }) {
          await callApi(
            {
              method: 'post',
              url: url.executeRow({ ...config, tableId, rowId, fieldId }),
              data: parameters,
            },
            config.token
          );
        },
      };
    case 'lookup':
    case 'rollup':
    case 'formula':
      return {
        value() {
          return row[fieldId];
        },
      };
  }
}

export function buildField<T extends FieldType = FieldType>(params: {
  field: APIField;
  tableId: string;
  config: ProjectConfig;
}) {
  const { field, tableId, config } = params;
  return {
    ...field,
    refRows:
      field.type !== 'relation'
        ? null
        : async (qs: { limit?: number; offset?: number; q?: string } = {}): Promise<Rows> => {
            const { nodes, totalCount } = await callApi(
              {
                method: 'get',
                url: url.row({ ...config, tableId: field.table }),
                params: { ...qs, isDisplayField: true },
              },
              config.token
            );
            const rowParam = { parentId: tableId, config };
            return {
              nodes: nodes.map((row: APIRow) => new RowImpl(rowParam, row)),
              totalCount,
            };
          },
    delete: async (): Promise<void> => {
      await callApi(
        {
          method: 'delete',
          url: url.field({ ...config, tableId, fieldId: field.id }),
        },
        config.token
      );
    },
    update: async (data: Partial<APIField<T>>): Promise<void> => {
      await callApi(
        {
          method: 'patch',
          url: url.field({ ...config, tableId, fieldId: field.id }),
          data,
        },
        config.token
      );
    },
  };
}
