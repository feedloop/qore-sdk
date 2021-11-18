// [WARNING] This file is generated by running `$ qore codegen` on your root project, please do not edit

/// <reference types="@feedloop/qore-client" />
import { QoreSchema } from "@feedloop/qore-client";

declare module "@feedloop/qore-client" {
  type TodoTableRow = {
    id: string;
    name: string;
    description: string;
    done: boolean;
    category: CategoryTableRow;
  };

  type CategoryTableRow = {
    id: string;
    name: string;
    description: string;
    todo: { nodes: TodoTableRow[] };
  };

  type MemberTableRow = {
    id: string;
    email: string;
    role: { id: string; displayField: string };
  };

  type AllTodoViewRow = {
    read: {
      id: string;
      name: string;
      description: string;
      done: boolean;
      category: CategoryTableRow;
    };
    write: {
      name: string;
      description: string;
      done: boolean;
      category: string[];
    };
    params: {};
    actions: {};
    forms: {};
  };

  type AllCategoryViewRow = {
    read: {
      id: string;
      name: string;
      description: string;
    };
    write: {
      name: string;
      description: string;
    };
    params: {};
    actions: {};
    forms: {};
  };

  type AllMemberViewRow = {
    read: {
      id: string;
      email: string;
      role: { id: string; displayField: string };
    };
    write: {
      email: string;
    };
    params: {};
    actions: {};
    forms: {};
  };

  type ProjectSchema = {
    allTodo: AllTodoViewRow;
    allCategory: AllCategoryViewRow;
    allMember: AllMemberViewRow;
  };
}