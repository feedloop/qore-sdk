/// <reference types="@feedloop/qore-client" />

import { QoreSchema } from "@feedloop/qore-client";

declare module "@feedloop/qore-client" {
  type MemberTableRow = {
    id: string;
    role: { id: string; displayField: string };
    email: string;
    toDo: { nodes: ToDoTableRow[] };
    totalTask: number;
    totalPoint: number;
    totalHardTask: number;
    password: string;
    taskDone: number;
    undoneTask: number;
  };

  type ToDoTableRow = {
    id: string;
    task: string;
    description: string;
    done: boolean;
    points: number;
    deadline: Date;
    difficulty: "Easy" | "Medium" | "Hard";
    person: { nodes: MemberTableRow[] };
    role: { id: string; displayField: string };
    attachment: string;
    timeAllocation: string;
  };

  type DoneViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
    };
    write: {
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
    };
    params: {};
    actions: {};
  };

  type MemberDefaultViewViewRow = {
    read: {
      id: string;
      email: string;
      role: { id: string; displayField: string };
      password: string;
    };
    write: {
      email: string;
      password: string;
    };
    params: {};
    actions: {
      createTask: {
        task?: string;
        description?: string;
      };
      addTask: {
        task?: string;
        description?: string;
      };
      insertTask: {};
      createTask2: {
        task?: string;
      };
    };
  };

  type MemberMetricViewRow = {
    read: {
      id: string;
      email: string;
      role: { id: string; displayField: string };
      totalTask: number;
      totalPoint: number;
      totalHardTask: number;
      taskDone: number;
      undoneTask: number;
    };
    write: {
      email: string;
    };
    params: {
      email: string;
    };
    actions: {};
  };

  type ReisTaskViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: { nodes: MemberTableRow[] };
      role: { id: string; displayField: string };
      attachment: string;
      timeAllocation: string;
    };
    write: {
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: string[];
      attachment: string;
    };
    params: {
      timeAllocation?: string;
    };
    actions: {};
  };

  type TestViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
    };
    write: {
      task: string;
      description: string;
    };
    params: {};
    actions: {};
  };

  type ToDoViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
    };
    write: {
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
    };
    params: {};
    actions: {};
  };

  type ToDoDefaultViewViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: { nodes: MemberTableRow[] };
      role: { id: string; displayField: string };
      timeAllocation: string;
      attachment: string;
    };
    write: {
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: string[];
      attachment: string;
    };
    params: {
      "$by.points"?: "desc";
    };
    actions: {};
  };

  type UndoneViewRow = {
    read: {
      id: string;
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: { nodes: MemberTableRow[] };
      role: { id: string; displayField: string };
      attachment: string;
      timeAllocation: string;
    };
    write: {
      task: string;
      description: string;
      done: boolean;
      points: number;
      deadline: Date;
      difficulty: "Easy" | "Medium" | "Hard";
      person: string[];
      attachment: string;
    };
    params: {
      undone?: string;
    };
    actions: {};
  };

  interface ProjectSchema extends QoreSchema {
    done: DoneViewRow;
    memberDefaultView: MemberDefaultViewViewRow;
    memberMetric: MemberMetricViewRow;
    reisTask: ReisTaskViewRow;
    test: TestViewRow;
    toDo: ToDoViewRow;
    toDoDefaultView: ToDoDefaultViewViewRow;
    undone: UndoneViewRow;
  }
}
