import { QoreClient } from "@qore/client";
import React from "react";
import createQoreContext from ".";

const qoreClient = new QoreClient<{
  allMembers: {
    read: { id: string; name: string };
    write: { name: string };
    params: { slug?: string };
  };
  allTasks: {
    read: { id: string; title: string };
    write: { title: string };
    params: { slug?: string };
  };
}>({
  organisationId: "FAKE_ORG",
  projectId: "FAKE_PROJECT"
});

qoreClient.init({
  version: "v1",
  views: [
    {
      id: "allTasks",
      name: "All tasks",
      tableId: "tasks",
      fields: [
        {
          id: "user",
          name: "user",
          type: "relation",
          table: "member",
          multiple: false,
          deletionProtection: false
        },
        {
          id: "subtasks",
          name: "subtasks",
          type: "relation",
          deletionProtection: false,
          table: "subtasks",
          multiple: true
        },
        {
          id: "done",
          name: "done",
          type: "boolean",
          deletionProtection: true
        },
        { type: "text", name: "id", id: "id", deletionProtection: false },
        { type: "text", name: "name", id: "name", deletionProtection: false }
      ]
    }
  ]
});

const qoreContext = createQoreContext(qoreClient);

const View = () => {
  const { data, status } = qoreContext.views.allTasks.useListRow(
    {
      limit: 10,
      offset: 0,
      slug: "slug"
    },
    { networkPolicy: "network-and-cache", pollInterval: 1000 }
  );

  qoreContext.views.allTasks.useGetRow("123456");

  qoreContext.views.allTasks.useInsertRow();

  qoreContext.views.allMembers.useInsertRow();

  qoreContext.views.allTasks.useUpdateRow();

  qoreContext.views.allTasks.useDeleteRow();

  return <div>{status === "loading" && <div>loading...</div>}</div>;
};

const App = () => {
  return <View />;
};
