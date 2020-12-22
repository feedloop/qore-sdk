import { setupRecorder } from "nock-record";
import fs from "fs";
import path from "path";
import Codegen from "./codegen";
import config from "../config";

const record = setupRecorder();

describe("codegen", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  it("should be able to generate codegen", async () => {
    const { completeRecording } = await record("codegen");
    await Codegen.run([
      "--project",
      "I0D3NimZQ9GKEDP",
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "3960f3b8-a139-42eb-8295-3d669e4da4c9"
    ]);
    completeRecording();
    const filename = path.resolve(process.cwd() + "/qore-generated.ts");
    expect(
      fs.readFileSync(filename, {
        encoding: "utf8"
      })
    ).toMatchSnapshot();
    fs.unlinkSync(filename);
  });
});
