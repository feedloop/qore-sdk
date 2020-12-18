import { setupRecorder } from "nock-record";
import fse from "fs-extra";
import path from "path";
import CreateProject from "./create-project";

const record = setupRecorder();
const projectName = "qore-project-test";

describe("create-project", () => {
  afterAll(() => {
    fse.removeSync(path.resolve(process.cwd(), projectName));
  });
  it("should be able to export schema", async () => {
    await CreateProject.run([
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "77f2ff71-8864-404d-8596-127d78a4c1bd",
      projectName
    ]);
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
        "77f2ff71-8864-404d-8596-127d78a4c1bd",
        "--template",
        "some-unknown-template",
        projectName
      ])
    ).rejects.toThrowError(
      'Cant find "some-unknown-template" from project templates, may want to choose from the following available templates: todo-list-typescript'
    );
  });
});
