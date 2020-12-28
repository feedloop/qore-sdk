import { Command, flags } from "@oclif/command";
import { default as makeUser } from "@feedloop/qore-sdk/lib/user";
import prompts from "prompts";
import config from "../config";

export default class Codegen extends Command {
  static description = "Login to qore cli";

  static examples = [`$ qore login`];

  static flags = {
    email: flags.string({ char: "p", description: "project id" })
  };

  async run() {
    const values = await prompts([
      { name: "email", type: "text", message: "Enter your email" },
      { name: "password", type: "password", message: "Enter your password" }
    ]);
    const user = makeUser();
    const token = await user.login(values.email, values.password);
    config.set("token", token);
    const orgs = await user.organizations();
    const defaultOrg = orgs[0].id;
    config.set("org", defaultOrg);
    this.log(`Logged in as ${values.email}`);
  }
}
