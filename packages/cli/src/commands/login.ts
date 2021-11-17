import config from "../config";
import { Command } from "@oclif/command";
import chalk from "chalk";
import prompts from "prompts";

export default class Login extends Command {
  static description = "Login to qore cli";

  static examples = [`$ qore login`];

  async run() {
    const values = await prompts([
      { name: "apiKey", type: "password", message: "Enter your apiKey" }
    ]);

    config.set("apiKey", values.apiKey);

    this.log(`\n\n${chalk.grey("Logged in")} ${chalk.green("success")} ...`);
    this.log(`\n${chalk.grey(`Welcome to qore-cli\n\n`)}`);
  }
}
