import config from "../config";
import { Command } from "@oclif/command";
import {} from "@oclif/command";
import chalk from "chalk";
import prompts from "prompts";

export default class SetURL extends Command {
  static description = "Set base url for project access";

  static examples = [`$ qore set-url`];

  async run() {
    const values = await prompts([
      { name: "url", type: "text", message: "Please enter your project url" }
    ]);

    config.set("url", values.url);

    this.log(
      `\n\n${chalk.grey("Project url set to:")} ${chalk.green(values.url)}`
    );
  }
}
