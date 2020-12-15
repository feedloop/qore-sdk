import { APITable, APIView, Field, Form, FormSummary, Vield } from "@qore/sdk";

export type TableSchema = APITable & {
  fields: Field[];
  forms: Form[];
};

export type ViewSchema = APIView & {
  vields: Vield[];
};

export type QoreSchema = {
  version: "v1";
  tables: TableSchema[];
  views: ViewSchema[];
};
