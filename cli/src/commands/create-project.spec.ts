import { setupRecorder } from "nock-record";
import fse from "fs-extra";
import { default as makeUser } from "@qore/sdk/lib/user";
import path from "path";
import CreateProject from "./create-project";

const record = setupRecorder();
const projectName = "qore-project-test";

describe("create-project", () => {
  afterAll(() => {
    fse.removeSync(path.resolve(process.cwd(), projectName));
  });
  it("should be able to export schema", async () => {
    process.env.REACT_APP_API_URL =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const { completeRecording } = await record("create-project");
    try {
      await CreateProject.run([
        "--org",
        "lIdfC42DJCN2XzQ",
        "--token",
        "3960f3b8-a139-42eb-8295-3d669e4da4c9",
        projectName
      ]);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const qoreConfig = fse.readFileSync(
      path.resolve(process.cwd(), projectName, "qore.config.json"),
      { encoding: "utf8" }
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
