import { APITable, APIView, Field, Form, FormSummary, Vield } from "@qore/sdk";

export type TableSchema = APITable & {
  fields: Field[];
  forms: FormSummary[];
};

export type ViewSchema = APIView & {
  vields: Vield[];
};

export type QoreSchema = {
  tables: TableSchema[];
  views: ViewSchema[];
};
