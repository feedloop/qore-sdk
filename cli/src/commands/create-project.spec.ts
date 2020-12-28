import { setupRecorder } from "nock-record";
import fse from "fs-extra";
import { default as makeUser } from "@feedloop/qore-sdk/lib/user";
import path from "path";
import CreateProject from "./create-project";
import config from "../config";

const record = setupRecorder();
const projectName = "qore-project-test";

describe("create-project", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  afterAll(() => {
    fse.removeSync(path.resolve(process.cwd(), projectName));
  });
  it("should be able to export schema", async () => {
    const { completeRecording } = await record("create-project");
    await CreateProject.run([
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "3960f3b8-a139-42eb-8295-3d669e4da4c9",
      projectName
    ]);

    const qoreConfig = await fse.readJson(
      path.resolve(process.cwd(), projectName, "qore.config.json")
    );
    expect(qoreConfig).toMatchSnapshot();
    await expect(
      CreateProject.run([
        "--org",
        "lIdfC42DJCN2XzQ",
        "--token",
        "3960f3b8-a139-42eb-8295-3d669e4da4c9",
        "--template",
        "some-unknown-template",
        projectName
      ])
    ).rejects.toThrowError(
      'Cant find "some-unknown-template" from project templates, may want to choose from the following available templates: todo-list-typescript'
    );
    completeRecording();
  });
});
