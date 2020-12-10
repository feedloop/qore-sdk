import { ProjectConfig } from '../project';
import { ViewMethod } from './viewMethod';
import { APIViewSummary, ViewSummaryImpl } from './viewSummary';

export type Sort = {
  order: string;
  by: string;
};

export type Parameter = {
  slug: string;
  type: string;
  required: boolean;
};

export type APIView = APIViewSummary & {
  filter: string;
  sorts: Sort[];
  parameters: Parameter[];
};

export type View = APIView & ViewMethod;

export class ViewImpl extends ViewSummaryImpl implements View {
  filter: APIView['filter'];
  parameters: APIView['parameters'];
  sorts: APIView['sorts'];
  constructor(params: APIView & { config: ProjectConfig }) {
    super(params);
    this.filter = params.filter;
    this.parameters = params.parameters;
    this.sorts = params.sorts;
  }
}
