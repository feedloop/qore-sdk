import { setupRecorder } from "nock-record";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import Codegen from "./codegen";
import config from "../config";

const record = setupRecorder();

describe("codegen", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  it("should be able to generate codegen", async () => {
    process.env.QORE_SERVER =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const { completeRecording } = await record("codegen");
    await Codegen.run([
      "--project",
      "I0D3NimZQ9GKEDP",
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "3960f3b8-a139-42eb-8295-3d669e4da4c9",
      "--path",
      "dest"
    ]);
    completeRecording();
    const qoreGenerated = path.resolve(process.cwd(), "dest", "qore-env.d.ts");
    expect(
      fse.readFileSync(qoreGenerated, { encoding: "utf-8" })
    ).toMatchSnapshot();
    const qoreConfig = path.resolve(process.cwd(), "dest", "qore.config.json");
    expect(await fse.readJSON(qoreConfig)).toMatchSnapshot();
    const qoreSchema = path.resolve(process.cwd(), "dest", "qore.schema.json");
    expect(await fse.readJSON(qoreSchema)).toMatchSnapshot();
  });
});
