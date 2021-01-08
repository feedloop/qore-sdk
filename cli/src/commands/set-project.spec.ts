import prompts from "prompts";
import { setupRecorder } from "nock-record";
import SetProject from "./set-project";
import config from "../config";

const record = setupRecorder();

describe("set-project", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  it("select project", async () => {
    process.env.QORE_SERVER =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const stdoutSpy = jest.spyOn(process.stdout, "write");
    prompts.inject(["mAQjA9ypixnsBDE", "U1tJvy7XhgOuVmI"]);
    const { completeRecording } = await record("set-project");
    await SetProject.run([]);
    expect(stdoutSpy).toHaveBeenCalledWith(
      "Successfully set project to Demo of the Org Demo organization\n"
    );
    completeRecording();
  });
});
