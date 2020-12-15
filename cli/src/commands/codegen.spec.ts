import { setupRecorder } from "nock-record";
import fs from "fs";
import path from "path";
import Codegen from "./codegen";

const record = setupRecorder();

describe("codegen", () => {
  it("should be able to generate codegen", async () => {
    process.env.REACT_APP_API_URL =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const { completeRecording } = await record("codegen");
    await Codegen.run([
      "--project",
      "I0D3NimZQ9GKEDP",
      "--org",
      "lIdfC42DJCN2XzQ",
      "--token",
      "77f2ff71-8864-404d-8596-127d78a4c1bd",
    ]);
    completeRecording();
    const filename = path.resolve(process.cwd() + "/qore-generated.ts");
    expect(
      fs.readFileSync(filename, {
        encoding: "utf8",
      })
    ).toMatchSnapshot();
    fs.unlinkSync(filename);
  });
});
