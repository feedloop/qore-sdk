import nock from "nock";
import QoreClient from "./Qore";

const createMockServer = () =>
  nock("http://localhost:80")
    .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views")
    .reply(200, {
      nodes: [
        {
          id: "allTasks",
          name: "All tasks",
          tableId: "tasks",
        },
        {
          id: "allMembers",
          name: "All members",
          tableId: "member",
        },
        {
          id: "memberTasks",
          name: "member tasks",
          tableId: "member",
        },
      ],
      totalCount: 3,
    })
    .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/fields")
    .reply(200, {
      nodes: [
        {
          id: "name",
          name: "name",
          type: "text",
          deletionProtection: false,
          createdAt: "2020-11-25T03:00:10.809Z",
        },
        {
          id: "user",
          name: "user",
          type: "relation",
          deletionProtection: false,
          createdAt: "2020-11-25T03:02:13.889Z",
          table: "member",
          multiple: false,
        },
        {
          id: "done",
          name: "done",
          type: "boolean",
          deletionProtection: false,
          createdAt: "2020-11-25T03:02:33.065Z",
        },
        {
          id: "subtasks",
          name: "subtasks",
          type: "relation",
          deletionProtection: false,
          createdAt: "2020-11-27T07:15:29.610Z",
          table: "subtasks",
          multiple: true,
        },
      ],
      totalCount: 3,
    })
    .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allMembers/fields")
    .reply(200, {
      nodes: [
        {
          id: "email",
          name: "email",
          type: "text",
          deletionProtection: true,
          createdAt: "2020-11-25T02:59:59.292Z",
        },
        {
          id: "role",
          name: "role",
          type: "role",
          deletionProtection: true,
          createdAt: "2020-11-25T02:59:59.295Z",
        },
      ],
      totalCount: 2,
    })
    .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/memberTasks/fields")
    .reply(200, {
      nodes: [
        {
          id: "email",
          name: "email",
          type: "text",
          deletionProtection: true,
          createdAt: "2020-11-25T02:59:59.292Z",
        },
        {
          id: "role",
          name: "role",
          type: "role",
          deletionProtection: true,
          createdAt: "2020-11-25T02:59:59.295Z",
        },
        {
          id: "tasks",
          name: "Tasks",
          type: "relation",
          deletionProtection: false,
          createdAt: "2020-11-25T03:02:13.909Z",
          table: "tasks",
          multiple: true,
        },
        {
          id: "doneTasks",
          name: "Done tasks",
          type: "rollup",
          deletionProtection: false,
          createdAt: "2020-11-25T03:04:48.448Z",
        },
      ],
      totalCount: 4,
    });

describe("Qore SDK", () => {
  let scope: nock.Scope;
  beforeEach(() => {
    scope = createMockServer();
  });
  afterEach(() => {
    scope.done();
  });
  it("initialize sdk", async () => {
    const qore = new QoreClient<{ allTasks: { id: string; name: string } }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    expect(qore.views.allTasks).toHaveProperty("readRows");
  });

  it("fetch view rows, read and write to cache", async () => {
    scope
      .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows?limit=1")
      .reply(200, {
        nodes: [
          {
            id: "25b0cccf-4851-43e2-80c7-f68e7883dbd6",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me",
            },
            name: "Meeting 1",
            done: true,
          },
        ],
        totalCount: "1",
      })
      .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows?limit=2")
      .reply(200, {
        nodes: [
          {
            id: "25b0cccf-4851-43e2-80c7-f68e7883dbd6",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me",
            },
            name: "Meeting 1",
            done: true,
          },
          {
            id: "dd7813b3-98b3-4baa-9fff-e754afba9af8",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me",
            },
            name: "Meeting 3",
            done: false,
          },
        ],
        totalCount: "2",
      });
    const qore = new QoreClient<{ allTasks: { id: string; name: string } }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const alltasks = await qore.views.allTasks.readRows({ limit: 2 });
    const sameTasks = await qore.views.allTasks.readRows({ limit: 2 });
    expect(alltasks).toEqual(sameTasks);
    const fewerTasks = await qore.views.allTasks.readRows({ limit: 1 });
    expect(alltasks).not.toEqual(fewerTasks);
  });

  it("read from subscription", async (done) => {
    scope
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "New task",
        user: null,
      })
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "Completely new task",
        user: null,
      });
    const qore = new QoreClient<{ allTasks: { id: string; name: string } }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const readStream = qore.views.allTasks.viewStream.row({
      id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
    });

    let resultsData: Array<{}> = [];

    const subscription = readStream.subscribe((result) => {
      if (result.error) done(result.error);
      if (result.data) {
        resultsData.push(result.data);
      }
      if (resultsData.length > 2) {
        expect(resultsData[0]).toEqual({
          id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
          description: null,
          done: false,
          name: "New task",
          user: null,
        });
        expect(resultsData[0]).toEqual(resultsData[1]);
        expect(resultsData[0]).not.toEqual(resultsData[2]);
        subscription.unsubscribe();
        done();
      }
    });
    setTimeout(() => {
      readStream.reExecute({});
      setTimeout(() => {
        readStream.reExecute({ config: { mode: "network" } });
      }, 1000);
    }, 1000);
  });

  it("insert a new row, write and read from cache", async () => {
    scope
      .post("/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows")
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
      })
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "New task",
        user: null,
      });
    const qore = new QoreClient<{ allTasks: { id: string; name: string } }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const newTask = await qore.views.allTasks.insertRow({
      name: "New task",
    });
    expect(newTask).toHaveProperty("name", "New task");
    const { data: cachedTask } = await qore.views.allTasks.viewStream
      .row({ id: newTask.id })
      .toPromise();
    expect(newTask).toEqual(cachedTask);
  });

  it("update a row", async () => {
    scope
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "Old task",
        user: {
          id: "9275e876-fd95-45a0-ad67-b947a1296c32",
          displayField: "rrmdn@pm.me",
        },
        subTasks: [{ id: "sdsd", displayField: "some sub task" }],
      })
      .patch(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, { ok: true });
    const qore = new QoreClient<{
      allTasks: {
        id: string;
        name: string;
        user?: { id: string };
        subtasks: [{ id: string }];
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const updatedTask = await qore.views.allTasks.updateRow(
      "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
      {
        name: "Old task",
        user: { id: "9275e876-fd95-45a0-ad67-b947a1296c32" },
        subtasks: [{ id: "ssdsd" }],
      }
    );
    expect(updatedTask).toHaveProperty("name", "Old task");
    expect(updatedTask.user).toEqual({
      id: "9275e876-fd95-45a0-ad67-b947a1296c32",
      displayField: "rrmdn@pm.me",
    });
  });

  it("delete a row", async () => {
    scope
      .delete(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, { ok: true });
    const qore = new QoreClient<{
      allTasks: {
        id: string;
        name: string;
        user?: { id: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    qore.views.allTasks.cache = new Map([
      [
        `allTasks:id:beba4104-44ee-46b2-9ddc-e6bfd0a1570f`,
        { id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f", name: "Some task" },
      ],
    ]);
    await qore.views.allTasks.deleteRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f");
    expect(qore.views.allTasks.cache.size).toEqual(0);
  });
});
