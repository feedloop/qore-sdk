import config from "../config";
import { Command } from "@oclif/command";
import chalk from "chalk";
import prompts from "prompts";

export default class Login extends Command {
  static description = "Login to qore cli";

  static examples = [`$ qore login`];

  async run() {
    const values = await prompts([
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
    this.log("test");
    this.log(values.url);
    if (values.url[values.url.length - 1] === "/") {
      values.url = values.url.substring(0, values.url.length - 1);
    }
    config.set("adminSecret", values.adminSecret || "admin-secret");
    config.set("url", values.url || "http://localhost:8080");

    this.log(`\n${chalk.grey("Context set")}`);
    this.log(`\n${chalk.grey(`Welcome to qore-cli\n\n`)}`);
  }
}
