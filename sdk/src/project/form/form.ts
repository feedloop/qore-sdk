import { ProjectConfig } from '../project';
import { FormMethod } from './formMethod';
import { APIFormSummary, FormSummaryImpl } from './formSummary';

export type FormFieldSetting = {
  id: string;
  required?: boolean;
  hidden?: boolean;
  defaultValue?: string;
};

export type APIForm = APIFormSummary & {
  fields: FormFieldSetting[];
};

export type Form = APIForm & FormMethod;

export class FormImpl extends FormSummaryImpl implements Form {
  fields: APIForm['fields'];
  constructor(params: APIForm & { config: ProjectConfig }) {
    super(params);
    this.fields = params.fields;
  }
}
