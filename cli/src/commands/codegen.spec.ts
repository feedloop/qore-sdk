import { setupRecorder } from "nock-record";
import fs from "fs";
import path from "path";
import Codegen from "./codegen";

const record = setupRecorder();

describe("codegen", () => {
  it("should be able to generate codegen", async () => {
    const { completeRecording } = await record("codegen");
    await Codegen.run([
      "--project",
      "MwSGN129jH8D1a0",
      "--org",
      "ntfvYtSmV8T3GMG",
      "--token",
      "3334164d-c7d0-4ca8-9b0c-913a9286f0b6",
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
