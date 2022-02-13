import config from "../config";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import prompts from "prompts";

export default class Login extends Command {
  static description = "Login to qore cli";

  static examples = [`$ qore login`];

  static flags = {
    adminSecret: flags.string({
      description: "admin secret",
      default: undefined
    }),
    url: flags.string({
      description: "url",
      default: undefined
    })
  };

  async run() {
    const { flags } = this.parse(Login);
    const values =
      flags.adminSecret && flags.url
        ? flags
        : await prompts([
            {
              name: "adminSecret",
              type: "text",
              message: "Enter your admin secret (default: admin-secret)"
            },
            {
              name: "url",
              type: "text",
              message: "Enter your project url (default: http://localhost:8080)"
            }
          ]);
    if (values.url[values.url.length - 1] === "/") {
      values.url = values.url.substring(0, values.url.length - 1);
    }
    config.set("adminSecret", values.adminSecret || "admin-secret");
    config.set("url", values.url || "http://localhost:8080");

    this.log(`\n${chalk.grey("Context set")}`);
    this.log(`\n${chalk.grey(`Welcome to qore-cli\n\n`)}`);
  }
}
