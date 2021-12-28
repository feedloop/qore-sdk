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
        type: "password",
        message: "Enter your admin secret"
      }
    ]);

    config.set("adminSecret", values.adminSecret);

    this.log(`\n${chalk.grey("Admin secret set")}`);
    this.log(`\n${chalk.grey(`Welcome to qore-cli\n\n`)}`);
  }
}
