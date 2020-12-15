import { setupRecorder } from "nock-record";
import fs from "fs";
import path from "path";
import ExportSchema from "./export-schema";
import CreateProject from "./create-project";

const record = setupRecorder();

describe("create-project", () => {
  it.skip("should be able to export schema", async () => {
    process.env.REACT_APP_API_URL =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const { completeRecording } = await record("create-project");

    await ExportSchema.run([
      "--project",
      "I0D3NimZQ9GKEDP",
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "77f2ff71-8864-404d-8596-127d78a4c1bd",
    ]);
    await CreateProject.run([
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "a1aa7351-700e-4fdb-af90-6f64c35339df",
      "--file",
      "./qore-schema.json",
      "new project from cli",
    ]);
    completeRecording();

    const filename = path.resolve(process.cwd() + "/qore-schema.json");
    fs.unlinkSync(filename);
  });
});
