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

    this.log(`Logged in ${chalk.green("success")} ....`);
    this.log("Welcome to qore-cli");
  }
}
