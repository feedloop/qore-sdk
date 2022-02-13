import axios from "axios";
import { setupRecorder } from "nock-record";
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
  let token: string | undefined;
  const config: QoreConfig = {
    endpoint: "http://localhost:8080",
    adminSecret: "admin-secret",
    getToken: () => token
  };
  beforeAll(async () => {
    const { completeRecording } = await recorder("beforeAll");
    await axios.post(
      "http://localhost:8080/v1/migrate",
      {
        operations: [
          {
            operation: "Create",
            resource: "Table",
            migration: {
              name: "product"
            }
          },
          {
            operation: "Create",
            resource: "Column",
            migration: {
              name: "name",
              table: "product",
              column: {
                type: "text",
                definition: {
                  textType: "text",
                  default: "",
                  unique: false
                }
              }
            }
          },
          {
            operation: "Create",
            resource: "Table",
            migration: {
              name: "todo"
            }
          },
          {
            operation: "Create",
            resource: "Table",
            migration: {
              name: "person"
            }
          },
          {
            operation: "Create",
            resource: "Column",
            migration: {
              table: "todo",
              name: "title",
              column: {
                type: "text",
                definition: {
                  textType: "text",
                  default: "",
                  unique: false
                }
              }
            }
          },
          {
            operation: "Create",
            resource: "Column",
            migration: {
              table: "person",
              name: "name",
              column: {
                type: "text",
                definition: {
                  textType: "text",
                  default: "",
                  unique: false
                }
              }
            }
          },
          {
            operation: "Create",
            resource: "OneToManyRelation",
            migration: {
              name: "persontodo",
              nullable: true,
              one: {
                table: "person"
              },
              many: {
                table: "todo"
              },
              onDelete: "RESTRICT",
              onUpdate: "RESTRICT"
            }
          },
          {
            operation: "Create",
            resource: "Role",
            migration: {
              name: "user"
            }
          },
          {
            operation: "Create",
            resource: "Permission",
            migration: {
              role: "user",
              tables: ["*"],
              actions: ["select", "insert", "update", "delete"]
            }
          }
        ]
      },
      {
        headers: {
          "x-qore-engine-admin-secret": "admin-secret"
        }
      }
    );
    const roles = await axios.get("http://localhost:8080/v1/roles", {
      headers: {
        "x-qore-engine-admin-secret": "admin-secret"
      }
    });
    await axios.post(
      "http://localhost:8080/v1/execute",
      {
        operations: [
          {
            operation: "Insert",
            instruction: {
              table: "users",
              name: "insertAyu",
              data: {
                external_id: "Ayu",
                roleId: roles.data.roles[0].id,
                password: "123456"
              }
            }
          },
          {
            operation: "Insert",
            instruction: {
              table: "product",
              name: "insertBaju",
              data: {
                name: "Baju"
              }
            }
          },
          {
            operation: "Insert",
            instruction: {
              table: "product",
              name: "insertRok",
              data: {
                name: "Rok"
              }
            }
          },
          {
            operation: "Insert",
            instruction: {
              table: "person",
              name: "insertPerson",
              data: {
                name: "Budi"
              }
            }
          },
          {
            operation: "Insert",
            instruction: {
              table: "todo",
              name: "insertCoding",
              data: {
                title: "Coding"
              }
            }
          }
        ]
      },
      {
        headers: {
          "x-qore-engine-admin-secret": "admin-secret"
        }
      }
    );

    const auth = await axios.post("http://localhost:8080/v1/authorize", {
      identifier: "Ayu",
      password: "123456"
    });
    token = auth.data.token;
    completeRecording();
  });

  it("insert rows", async () => {
    const { completeRecording } = await recorder("insert rows");
    const qore = new QoreClient(config);
    const res = await qore.view("product").insertRow({
      name: "Hello"
    });
    expect(res).toHaveProperty("results");
    expect(res.results).toHaveProperty("data");
    completeRecording();
  });

  it("read rows", async () => {
    const { completeRecording } = await recorder("read rows");
    const qore = new QoreClient(config);
    const res = await qore.view("product").readRows().toPromise();
    expect(res).toHaveProperty("data");
    completeRecording();
  });

  it("read row", async () => {
    const { completeRecording } = await recorder("read row");
    const qore = new QoreClient(config);
    const res = await qore.view("product").readRow("1").toPromise();
    expect(res).toHaveProperty("data");
    completeRecording();
  });
  it("update row", async () => {
    const { completeRecording } = await recorder("insert row");
    const qore = new QoreClient(config);
    const res = await qore.view("product").updateRow("1", {
      name: "Hello"
    });
    expect(res).toHaveProperty("results");
    expect(res.results).toHaveProperty("data");
    completeRecording();
  });

  it("delete row", async () => {
    const { completeRecording } = await recorder("delete row");
    const qore = new QoreClient(config);
    const res = await qore.view("product").deleteRow("2");
    expect(res).toEqual(true);
    completeRecording();
  });

  it("add relation", async () => {
    const { completeRecording } = await recorder("add relation");
    const qore = new QoreClient(config);
    const res = await qore.view("todo").addRelation("1", {
      persontodo: ["1"]
    });
    expect(res).toEqual(true);
    completeRecording();
  });

  it("remove relation", async () => {
    const { completeRecording } = await recorder("remove relation");
    const qore = new QoreClient(config);
    const res = await qore.view("todo").removeRelation("1", {
      persontodo: ["1"]
    });
    expect(res).toEqual(true);
    completeRecording();
  });
});
