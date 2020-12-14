import nock from "nock";
import Wonka from "wonka";
import QoreClient from "./Qore";

const createMockServer = () =>
  nock("http://localhost:8080")
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
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    expect(qore.views.allTasks).toHaveProperty("readRows");
  });

  it("fetch view rows, read and write to cache", async () => {
    scope
      .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows?limit=1&slug=some-slug&order=asc")
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
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string, doneTasks: number };
        write: { id: string; name: string };
        params: {
          slug?: string;
          "$by.name"?: "asc" | "desc";
          "$by.description"?: "asc";
        };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const alltasks = await qore.views.allTasks
      .readRows({ limit: 2 })
      .toPromise();
    const cachedTask = await qore.views.allTasks
      .readRows({ limit: 2 }, { networkPolicy: "cache-only" })
      .toPromise();
    expect(alltasks.data).toEqual(cachedTask.data);
    expect(alltasks.operation.meta.cacheHit).toEqual(false);
    expect(cachedTask.operation.meta.cacheHit).toEqual(true);
    const fewerTasks = await qore.views.allTasks
      .readRows({ limit: 1, slug: 'some-slug', order: "asc" })
      .toPromise();
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
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const readStream = qore.views.allTasks.readRow(
      "beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
    );

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
      readStream.revalidate();
      setTimeout(() => {
        readStream.revalidate({
          networkPolicy: "network-only",
          pollInterval: 5000,
        });
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
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    const newTask = await qore.views.allTasks.insertRow({
      name: "New task",
    });
    expect(newTask).toHaveProperty("name", "New task");
    const { data: cachedTask } = await qore.views.allTasks
      .readRow(newTask.id)
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
        read: {
          id: string;
          name: string;
          user: { id: string; name: string };
          subtasks: [{ id: string; name: string }];
        };
        write: {
          id: string;
          name: string;
          user: string[];
          subtasks: string[];
        };
        params: { slug?: string };
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
        user: ["9275e876-fd95-45a0-ad67-b947a1296c32"],
        subtasks: ["another-task"],
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
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
    });
    await qore.init();
    await qore.views.allTasks.deleteRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f");
  });

  it("authenticate a user", async () => {
    scope
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(401)
      .post("/orgs/FAKE_ORG/projects/FAKE_PROJECT/login")
      .reply(200, { email: "rrmdn@pm.me", token: "some-token" })
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, { id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f" });
    let token: string | undefined = undefined;
    const mockGetToken = jest.fn(() => token);
    const mockOnError = jest.fn((error) => {});
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
      getToken: mockGetToken,
      onError: mockOnError,
    });
    await qore.init();
    const tasks = await qore.views.allTasks
      .readRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
      .toPromise();
    expect(tasks.data).toEqual(undefined);
    expect(tasks.error?.message).toEqual("Request failed with status code 401");
    token = await qore.authenticate("rrmdn@pm.me", "some-password");
    const row = await qore.views.allTasks
      .readRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f", {
        networkPolicy: "network-only",
      })
      .toPromise();
    expect(row.error).toEqual(undefined);
    expect(row.data).not.toEqual(undefined);
    expect(mockOnError.mock.calls[0][0]).toEqual(
      new Error("Request failed with status code 401")
    );
    expect(mockGetToken.mock.calls.length).toEqual(7);
  });
});
