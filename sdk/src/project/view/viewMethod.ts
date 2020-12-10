import { Row, Rows } from '../row';
import { APIView } from './view';
import { Vield } from './viewSummary';

export type ViewMethod = {
  addVield(id: string): Promise<void>;
  vields(): Promise<Vield[]>;
  reorderVieldAfter(fieldId: string, afterFieldId: string): Promise<void>;
  rowsCount(qs: {
    [key: string]: any;
    limit?: number;
    offset?: number;
    isDisplayField?: boolean;
  }): Promise<{ totalCount: number }>;
  rows(qs: {
    [key: string]: any;
    limit?: number;
    offset?: number;
    isDisplayField?: boolean;
  }): Promise<Rows>;
  row(rowId: string): Promise<Row>;
  addRow(params?: { [key: string]: any }): Promise<string>;
  update(view: Omit<APIView, 'id' | 'vields'> & { vields: string[] }): Promise<void>;
  delete(): Promise<void>;
};
