import { setupRecorder } from "nock-record";
import fs from "fs";
import path from "path";
import ExportSchema from "./export-schema";
import config from "../config";

const record = setupRecorder();

describe("export-schema", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  it("should be able to export schema", async () => {
    process.env.QORE_SERVER =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const { completeRecording } = await record("export-schema");
    await ExportSchema.run([
      "--project",
      "I0D3NimZQ9GKEDP",
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "3960f3b8-a139-42eb-8295-3d669e4da4c9"
    ]);
    completeRecording();
    const filename = path.resolve(process.cwd() + "/qore.schema.json");
    expect(
      fs.readFileSync(filename, {
        encoding: "utf8"
      })
    ).toMatchSnapshot();
    fs.unlinkSync(filename);
  });
});
