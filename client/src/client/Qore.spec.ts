import nock from "nock";
import { QoreProjectSchema } from "../types";
import QoreClient from "./Qore";

const fakeProjectSchema = (): QoreProjectSchema => ({
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
        { id: "done", name: "done", type: "boolean", deletionProtection: true },
        { type: "text", name: "id", id: "id", deletionProtection: false },
        { type: "text", name: "name", id: "name", deletionProtection: false },
        {
          id: "finishTask",
          name: "finishTask",
          type: "action",
          tasks: [{ update: { done: "true" }, type: "update" }],
          parameters: [],
          deletionProtection: false
        }
      ]
    }
  ]
});

describe("Qore SDK", () => {
  let scope: nock.Scope;
  beforeEach(() => {
    scope = scope = nock("http://localhost:8080");
  });
  afterEach(() => {
    // scope.done();
  });
  it("initialize sdk", async () => {
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    expect(qore.views.allTasks).toHaveProperty("readRows");
  });

  it("fetch view rows, read and write to cache", async () => {
    scope = scope
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows?limit=1&slug=some-slug&order=asc"
      )
      .reply(200, {
        nodes: [
          {
            id: "25b0cccf-4851-43e2-80c7-f68e7883dbd6",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me"
            },
            name: "Meeting 1",
            done: true
          }
        ],
        totalCount: "1"
      })
      .get("/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows?limit=2")
      .reply(200, {
        nodes: [
          {
            id: "25b0cccf-4851-43e2-80c7-f68e7883dbd6",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me"
            },
            name: "Meeting 1",
            done: true
          },
          {
            id: "dd7813b3-98b3-4baa-9fff-e754afba9af8",
            user: {
              id: "9275e876-fd95-45a0-ad67-b947a1296c32",
              displayField: "rrmdn@pm.me"
            },
            name: "Meeting 3",
            done: false
          }
        ],
        totalCount: "2"
      });
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string; doneTasks: number };
        write: { id: string; name: string };
        params: {
          slug?: string;
          "$by.name"?: "asc" | "desc";
          "$by.description"?: "asc";
        };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
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
      .readRows({ limit: 1, slug: "some-slug", order: "asc" })
      .toPromise();
    expect(alltasks).not.toEqual(fewerTasks);
  });

  it("read from subscription", async done => {
    scope = scope
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "New task",
        user: null
      })
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "Completely new task",
        user: null
      });
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    const readStream = qore.views.allTasks.readRow(
      "beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
    );

    let resultsData: Array<{}> = [];
    const subscription = readStream.subscribe(result => {
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
          user: null
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
          pollInterval: 5000
        });
      }, 1000);
    }, 1000);
  });

  it("insert a new row, write and read from cache", async () => {
    scope = scope
      .post("/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows")
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      })
      .get(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/views/allTasks/v2rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, {
        id: "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
        description: null,
        done: false,
        name: "New task",
        user: null
      });
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    const newTask = await qore.views.allTasks.insertRow({
      name: "New task"
    });
    expect(newTask).toHaveProperty("name", "New task");
    const { data: cachedTask } = await qore.views.allTasks
      .readRow(newTask.id)
      .toPromise();
    expect(newTask).toEqual(cachedTask);
  });

  it("update a row", async () => {
    scope = scope
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
          displayField: "rrmdn@pm.me"
        },
        subTasks: [{ id: "sdsd", displayField: "some sub task" }]
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
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    const updatedTask = await qore.views.allTasks.updateRow(
      "beba4104-44ee-46b2-9ddc-e6bfd0a1570f",
      {
        name: "Old task",
        user: ["9275e876-fd95-45a0-ad67-b947a1296c32"],
        subtasks: ["another-task"]
      }
    );
    expect(updatedTask).toHaveProperty("name", "Old task");
    expect(updatedTask.user).toEqual({
      id: "9275e876-fd95-45a0-ad67-b947a1296c32",
      displayField: "rrmdn@pm.me"
    });
  });

  it("delete a row", async () => {
    scope = scope
      .delete(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(200, { ok: true });
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    await expect(
      qore.views.allTasks.deleteRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
    ).resolves.toEqual(true);
  });

  it("reject promise when delete a row failed", async () => {
    scope = scope
      .delete(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f"
      )
      .reply(500, { ok: false });
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: { slug?: string };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());
    await expect(
      qore.views.allTasks.deleteRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
    ).rejects.toThrow("Request failed with status code 500");
  });

  it("authenticate a user", async () => {
    scope = scope
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
    const mockOnError = jest.fn(error => {});
    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT",
      getToken: mockGetToken,
      onError: mockOnError
    });
    qore.init(fakeProjectSchema());
    const tasks = await qore.views.allTasks
      .readRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
      .toPromise();
    expect(tasks.data).toEqual(undefined);
    expect(tasks.error?.message).toEqual("Request failed with status code 401");
    token = await qore.authenticate("rrmdn@pm.me", "some-password");
    const row = await qore.views.allTasks
      .readRow("beba4104-44ee-46b2-9ddc-e6bfd0a1570f", {
        networkPolicy: "network-only"
      })
      .toPromise();
    expect(row.error).toEqual(undefined);
    expect(row.data).not.toEqual(undefined);
    expect(mockOnError.mock.calls[0][0]).toEqual(
      new Error("Request failed with status code 401")
    );
    expect(mockGetToken.mock.calls.length).toEqual(3);
  });

  it("trigger an action", async () => {
    scope = scope
      .post(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f/action/finishTask"
      )
      .reply(200, { ok: true });

    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {
          finishTask: {};
        };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());

    await expect(
      qore.views.allTasks
        .rowActions("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
        .finishTask.trigger({})
    ).resolves.toEqual(true);
  });

  it("reject promise when trigger action failed", async () => {
    scope = scope
      .post(
        "/orgs/FAKE_ORG/projects/FAKE_PROJECT/tables/tasks/rows/beba4104-44ee-46b2-9ddc-e6bfd0a1570f/action/finishTask"
      )
      .reply(500);

    const qore = new QoreClient<{
      allTasks: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {
          finishTask: {};
        };
      };
    }>({
      organisationId: "FAKE_ORG",
      projectId: "FAKE_PROJECT"
    });
    qore.init(fakeProjectSchema());

    await expect(
      qore.views.allTasks
        .rowActions("beba4104-44ee-46b2-9ddc-e6bfd0a1570f")
        .finishTask.trigger({})
    ).rejects.toThrow("Request failed with status code 500");
  });
});
