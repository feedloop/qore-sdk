import { QoreProjectSchema } from "@feedloop/qore-sdk";
import makeProject from "@feedloop/qore-sdk/lib/project";
import { setupRecorder } from "nock-record";
import { QoreSchema } from "../types";
import QoreClient, { QoreConfig } from "./Qore";

type TestSchema = {
  memberDefaultView: {
    read: { id: string; email: string };
    write: {};
    actions: {
      addTask: {
        task: string;
        description: string;
      };
    };
    params: {};
    forms: {};
  };
  toDoDefaultView: {
    read: {
      id: string;
      task: string;
      done: boolean;
      difficulty: string;
      points: number;
      person: { nodes: Array<{ id: string; displayField: string }> };
      attachment: string[];
    };
    write: {
      id: string;
      task: string;
      done: boolean;
      difficulty: string;
      points: number;
      person: string[];
      attachment: string[];
    };
    params: { slug?: string };
    actions: {};
    forms: {
      todoForm: {
        task: string;
        description?: string;
        done?: boolean;
        points?: number;
        deadline?: Date;
      };
    };
  };
};

const recorder = setupRecorder();

describe("Qore SDK", () => {
  process.env.QORE_SERVER = "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
  const userToken = "d5a1c695-7961-4098-97c6-915da7d909c9";
  let projectToken: string | undefined;
  let schema: QoreProjectSchema;
  let authenticationId: string | undefined;
  const config: QoreConfig = {
    endpoint: "https://p-qore-dot-pti-feedloop.et.r.appspot.com",
    organizationId: "lIdfC42DJCN2XzQ",
    projectId: "I0D3NimZQ9GKEDP",
    getToken: () => projectToken
  };
  beforeAll(async () => {
    const { completeRecording } = await recorder("beforeAll");
    const project = makeProject(config);
    await project.auth.signInWithUserToken(userToken);
    projectToken = project.auth.token()?.replace("Bearer ", "");
    const authConfig = await project.authConfig();
    authenticationId = authConfig.password?.id;
    schema = await project.exportSchema();
    completeRecording();
  });

  it("initialize sdk", async () => {
    const { completeRecording } = await recorder("initialize sdk");
    const qore = new QoreClient(config);
    qore.init(schema);
    expect(Object.keys(qore.views)).toEqual(schema.views.map(v => v.id));
    completeRecording();
  });

  it("fetch view rows, read and write to cache", async () => {
    const { completeRecording } = await recorder(
      "fetch view rows, read and write to cache"
    );
    const qore = new QoreClient<{
      undone: {
        read: { id: string; name: string; doneTasks: number };
        write: { id: string; name: string };
        params: {
          undone?: string;
          "$by.name"?: "asc" | "desc";
          "$by.description"?: "asc";
        };
        actions: {};
        forms: {};
      };
    }>(config);
    qore.init(schema);
    const alltasks = await qore.views.undone.readRows({ limit: 2 }).toPromise();
    const cachedTask = await qore.views.undone
      .readRows({ limit: 2 }, { networkPolicy: "cache-only" })
      .toPromise();
    expect(alltasks.data).toEqual(cachedTask.data);
    expect(alltasks.operation.meta.cacheHit).toBeFalsy();
    expect(cachedTask.operation.meta.cacheHit).toEqual(true);
    const fewerTasks = await qore.views.undone
      .readRows({ limit: 1, undone: "true", order: "asc" })
      .toPromise();
    expect(alltasks).not.toEqual(fewerTasks);
    completeRecording();
  });

  it("views accesible without calling init method", async () => {
    const { completeRecording } = await recorder(
      "views accesible without calling init method"
    );
    const qore = new QoreClient<{
      undone: {
        read: { id: string; name: string; doneTasks: number };
        write: { id: string; name: string };
        params: {
          undone?: string;
          "$by.name"?: "asc" | "desc";
          "$by.description"?: "asc";
        };
        actions: {};
        forms: {};
      };
    }>(config);
    const alltasks = await qore
      .view("undone")
      .readRows({ limit: 2 })
      .toPromise();
    const cachedTask = await qore.views.undone
      .readRows({ limit: 2 }, { networkPolicy: "cache-only" })
      .toPromise();
    expect(alltasks.data).toEqual(cachedTask.data);
    expect(alltasks.operation.meta.cacheHit).toBeFalsy();
    expect(cachedTask.operation.meta.cacheHit).toEqual(true);
    const fewerTasks = await qore.views.undone
      .readRows({ limit: 1, undone: "true", order: "asc" })
      .toPromise();
    expect(alltasks).not.toEqual(fewerTasks);
    completeRecording();
  });

  it("read from subscription", async done => {
    const { completeRecording } = await recorder("read from subscription");
    const qore = new QoreClient<{
      done: {
        read: { id: string; name: string };
        write: { id: string; name: string };
        params: { slug?: string };
        actions: {};
        forms: {};
      };
    }>(config);
    qore.init(schema);
    const { data: rows } = await qore.views.done
      .readRows({ limit: 1 })
      .toPromise();
    const id = rows?.nodes[0].id || "";
    const readStream = qore.views.done.readRow(id);

    let resultsData: Array<{}> = [];
    const subscription = readStream.subscribe(result => {
      if (result.error) done(result.error);
      if (result.data) {
        resultsData.push(result.data);
      }
      if (resultsData.length > 1) {
        expect(resultsData[0]).toEqual(resultsData[1]);
        subscription.unsubscribe();
        completeRecording();
        done();
      }
    });

    setTimeout(() => {
      readStream.revalidate();
    }, 1000);
  });

  it("insert a new row, write and read from cache", async () => {
    const { completeRecording } = await recorder(
      "insert a new row, write and read from cache"
    );
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const newTask = await qore.view("toDoDefaultView").insertRow({
      task: "New task",
      difficulty: "Easy",
      done: false,
      points: 10
    });
    expect(newTask).toHaveProperty("task", "New task");
    const { data: cachedTask } = await qore.views.toDoDefaultView
      .readRow(newTask.id)
      .toPromise();
    expect(newTask).toEqual(cachedTask);
    completeRecording();
  });

  it("update a row", async () => {
    const { completeRecording } = await recorder("update a row");
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const { data: rows } = await qore.views.toDoDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    const id = rows?.nodes[0].id || "";
    const updatedTask = await qore.views.toDoDefaultView.updateRow(id, {
      done: !rows?.nodes[0].done
    });
    expect(updatedTask).toHaveProperty("done", !rows?.nodes[0].done);
    completeRecording();
  });

  it("revalidate a row with optimistic response", async done => {
    const { completeRecording } = await recorder(
      "revalidate a row with optimistic response"
    );
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const { data: rows } = await qore.views.toDoDefaultView
      .readRows({ limit: 1 })
      .toPromise();

    const id = rows?.nodes[0].id || "";
    const rowStream = qore.views.toDoDefaultView.readRow(id);
    const results: any[] = [];
    const subs = rowStream.subscribe(async result => {
      try {
        results.push(result.data);
        // revalidate first result with an optimistic response
        if (results.length === 1) {
          const firstResult = results[0];
          rowStream.revalidate({
            networkPolicy: "cache-only",
            optimisticResponse: { done: !firstResult?.done }
          });
        }
        // optimistic response should take effect on the next result
        if (results.length === 2) {
          expect(results[0]).not.toEqual(results[1]);
          subs.unsubscribe();
          done();
          completeRecording();
        }
      } catch (error) {
        done(error);
      }
    });
  });

  it("delete a row", async () => {
    const { completeRecording } = await recorder("delete a row");

    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const { data: rows } = await qore.views.toDoDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    const id = rows?.nodes[0].id || "";
    await expect(qore.views.toDoDefaultView.deleteRow(id)).resolves.toEqual(
      true
    );
    const { error, data } = await qore.views.toDoDefaultView
      .readRow(id)
      .toPromise();
    expect(data).toBeFalsy();
    expect(error?.message).toEqual("Request failed with status code 500");
    completeRecording();
  });

  it("reject promise when delete a row failed", async () => {
    const { completeRecording } = await recorder(
      "reject promise when delete a row failed"
    );
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    await expect(
      qore.views.toDoDefaultView.deleteRow("this id does not exist")
    ).rejects.toThrow("Request failed with status code 400");
    completeRecording();
  });

  it("authenticate a user", async () => {
    const { completeRecording } = await recorder("authenticate a user");
    let token: string | undefined = undefined;
    const mockGetToken = jest.fn(() => token);
    const mockOnError = jest.fn(error => {});
    const qore = new QoreClient<TestSchema>({
      ...config,
      authenticationId,
      getToken: mockGetToken,
      onError: mockOnError
    });
    qore.init(schema);
    const tasks = await qore.views.toDoDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    expect(tasks.data).toEqual(undefined);
    expect(tasks.error?.message).toEqual("Request failed with status code 401");
    token = await qore.authenticate("rama@feedloop.io", "123");
    const { data: rows, error } = await qore.views.toDoDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    expect(rows).not.toEqual(undefined);
    expect(mockOnError.mock.calls[0][0]).toEqual(
      new Error("Request failed with status code 401")
    );
    expect(mockGetToken.mock.calls.length).toEqual(3);
    completeRecording();
  });

  it("trigger an action", async () => {
    const { completeRecording } = await recorder("trigger an action");
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const { data: rows } = await qore.views.memberDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    const id = rows?.nodes[0].id || "";
    await expect(
      qore.views.memberDefaultView.actions.addTask.trigger(id, {
        task: "new task",
        description: "new task desc"
      })
    ).resolves.toEqual(true);
    completeRecording();
  });

  it("reject promise when trigger action failed", async () => {
    const { completeRecording } = await recorder(
      "reject promise when trigger action failed"
    );
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);

    await expect(
      qore
        .view("memberDefaultView")
        .action("addTask")
        .trigger("this id does not exist", {
          task: "new task",
          description: "new task desc"
        })
    ).rejects.toThrow("Trigger has failed");
    completeRecording();
  });

  it.skip("upload file", async () => {
    const { completeRecording } = await recorder("upload file");
    try {
      const qore = new QoreClient<TestSchema>(config);
      qore.init(schema);

      const fileUrl = await qore.views.toDoDefaultView.upload(
        new File([], "photo.jpg")
      );
      expect(fileUrl).toEqual("");
    } catch (error) {
      console.error(error);
      throw error;
    }

    completeRecording();
  });

  it("add & remove relation", async () => {
    const { completeRecording } = await recorder("add & remove relation");
    const qore = new QoreClient<TestSchema>(config);
    qore.init(schema);
    const { data: members } = await qore.views.memberDefaultView
      .readRows({ limit: 1 })
      .toPromise();
    const member = members?.nodes[0];
    if (!member) throw new Error("No member");
    const { id: taskId } = await qore.views.toDoDefaultView.insertRow({
      task: "New task",
      difficulty: "Easy"
    });
    const { data: task } = await qore.views.toDoDefaultView
      .readRow(taskId, { networkPolicy: "network-only" })
      .toPromise();
    expect(task?.person.nodes).toEqual([]);
    await qore.views.toDoDefaultView.addRelation(taskId, {
      person: [member.id]
    });
    const {
      data: taskWithPerson
    } = await qore.views.toDoDefaultView
      .readRow(taskId, { networkPolicy: "network-only" })
      .toPromise();
    if (!taskWithPerson) throw new Error("No taskWithPerson");
    expect(taskWithPerson?.person.nodes[0].id).toEqual(member.id);
    await qore.views.toDoDefaultView.removeRelation(taskWithPerson?.id, {
      person: [taskWithPerson.person.nodes[0].id]
    });

    const {
      data: taskWithoutPerson
    } = await qore.views.toDoDefaultView
      .readRow(taskId, { networkPolicy: "network-only" })
      .toPromise();

    expect(taskWithoutPerson?.person.nodes).toEqual([]);

    completeRecording();
  });

  it("send form inputs", async () => {
    const { completeRecording } = await recorder("send form inputs");
    const qore = new QoreClient<TestSchema>(config);
    const newRow = await qore
      .view("toDoDefaultView")
      .form("todoForm")
      .sendForm({ task: "Some task", done: true });
    expect(newRow).toHaveProperty("id");
    completeRecording();
  });

  it("fetches current user", async () => {
    const { completeRecording } = await recorder("fetches current user");
    const qore = new QoreClient<TestSchema>(config);
    const currentUser = await qore.currentUser();
    expect(currentUser).toMatchSnapshot();
    completeRecording();
  });

  it("dedupes duplicate reads", async () => {
    const { completeRecording, scopes } = await recorder(
      "dedupes duplicate reads"
    );
    const qore = new QoreClient<TestSchema>(config);
    const readStream = qore.views.memberDefaultView.readRows({ limit: 1 });
    const responses = await Promise.all([
      readStream.toPromise(),
      readStream.toPromise()
    ]);
    expect(responses[0].data).toEqual(responses[1].data);
    completeRecording();
    // 1st scope is OPTIONS, 2nd scope is GET
    expect(scopes.length).toEqual(2);
  });

  it("fetches more rows", async () => {
    const { completeRecording } = await recorder("fetches more rows");
    const qore = new QoreClient<TestSchema>(config);
    const stream = qore.view("toDoDefaultView").readRows({ limit: 1 });
    const items = await stream.toPromise();
    await stream.fetchMore({ offset: items.data?.nodes.length, limit: 1 });
    const moreItems = await stream.revalidate({ networkPolicy: "cache-only" });
    expect(items.data?.nodes.length).not.toEqual(moreItems.data?.nodes.length);
    completeRecording();
  });
});
