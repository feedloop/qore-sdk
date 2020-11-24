import { expect, test } from "@oclif/test";
import prompts from "prompts";

describe("login", () => {
  prompts.inject(["ajudan@feedloop.io", "some-pass"]);
  test
    .nock("https://qore-api.feedloop.io", (api) =>
      api
        .post("/login")
        .reply(200, { email: "ajudan@feedloop.io", token: "some-token" })
    )
    .stdout()
    .command(["login"])
    .it("notify successful login", (ctx) => {
      expect(ctx.stdout).to.equal("Logged in as ajudan@feedloop.io\n");
    });

  test
    .nock("https://qore-api.feedloop.io", (api) =>
      api.post("/login").reply(403)
    )
    .stderr()
    .command(["login"])
    .exit(100)
    .it("failed login");
});
