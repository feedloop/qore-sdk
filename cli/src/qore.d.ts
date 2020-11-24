declare module QORE {
  export interface Parameter {
    slug: string;
    type: string;
  }

  export interface Field {
    name: string;
    type: string;
    id: string;
    parameters: Parameter[];
  }

  export interface Table {
    name: string;
    type: string;
    id: string;
    fields: Field[];
  }

  export interface Role {
    id: string;
    name: string;
    isAdmin: boolean;
  }

  export interface Field2 {
    required: boolean;
    id: string;
    hidden?: boolean;
  }

  export interface Form {
    name: string;
    id: string;
    tableId: string;
    fields: Field2[];
  }

  export interface Parameter2 {
    slug: string;
    type: string;
  }

  export interface Sort {
    by: string;
    order: string;
  }

  export interface Parameter3 {
    slug: string;
    type: string;
  }

  export interface Field3 {
    name: string;
    type: string;
    id: string;
    parameters: Parameter3[];
  }

  export interface View {
    id: string;
    name: string;
    tableId: string;
    parameters: Parameter2[];
    sorts: Sort[];
    fields: Field3[];
  }

  export interface Schema {
    tables: Table[];
    roles: Role[];
    forms: Form[];
    views: View[];
  }
}
