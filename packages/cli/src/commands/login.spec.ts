import prompts from "prompts";
import { setupRecorder } from "nock-record";
import Login from "./login";
import config from "../config";

const record = setupRecorder();

describe("login", () => {
  beforeEach(() => {
    config.reset("org", "project", "token");
  });
  it("authenticate user", async () => {
    process.env.QORE_SERVER =
      "https://p-qore-dot-pti-feedloop.et.r.appspot.com";
    const stdoutSpy = jest.spyOn(process.stdout, "write");
    prompts.inject(["rama@feedloop.io", "123"]);
    const { completeRecording } = await record("login");
    await Login.run([]);
    expect(stdoutSpy).toHaveBeenCalledWith("Logged in as rama@feedloop.io\n");
    completeRecording();
  });
});
