import prompts from "prompts";
import { setupRecorder } from "nock-record";
import Login from "./login";

const record = setupRecorder();

describe("login", () => {
  it("authenticate user", async () => {
    const stdoutSpy = jest.spyOn(process.stdout, "write");
    prompts.inject(["rama@feedloop.io", "123"]);
    const { completeRecording } = await record("login");
    await Login.run([]);
    expect(stdoutSpy).toHaveBeenCalledWith("Logged in as rama@feedloop.io\n");
    completeRecording();
  });
});
