import { callApi } from '../common';
import { Column } from './column';
import { buildRowField, Field, FieldType } from './field/field';
import { ProjectConfig } from './project';
import { url } from './url';

export type APIRow<T = Record<string, any>> = {
  id: string;
} & T;

export type Rows<T = Record<string, any>> = {
  nodes: Row<T>[];
  totalCount: number;
};

export type Row<T = Record<string, any>> = APIRow<T> & {
  _config: ProjectConfig;
  parentId: string;
  displayField(): string;
  col: <T extends FieldType = FieldType>(field: Field<FieldType>) => Column<T>;
  delete(): Promise<void>;
} & T;

export class RowImpl implements Row {
  parentId: string;
  id: string;
  _config: ProjectConfig;
  _row: APIRow;
  constructor(params: { config: ProjectConfig; parentId: string }, row: APIRow) {
    this.parentId = params.parentId;
    this.id = row.id;
    this._row = row;
    this._config = params.config;
  }
  displayField() {
    return this._row['displayField'];
  }
  col(field: Field): any {
    return buildRowField({
      field,
      config: this._config,
      row: this._row,
      tableId: this.parentId,
      rowId: this.id,
    });
  }
  async delete(): Promise<void> {
    await callApi(
      {
        method: 'delete',
        url: url.row({
          ...this._config,
          tableId: this.parentId,
          rowId: this.id,
        }),
      },
      this._config.token
    );
    return;
  }
}
