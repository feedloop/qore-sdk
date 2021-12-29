import config from "../config";
import { Command } from "@oclif/command";
import {} from "@oclif/command";
import chalk from "chalk";

export default class Context extends Command {
  static description = "Set base url for project access";

  static examples = [`$ qore set-url`];

  async run() {
    const url = config.get("url");
    const adminSecret = config.get("adminSecret");
    this.log(
      `
     ${chalk.blue("url:")} ${chalk.grey(url)}
     ${chalk.blue("admin secret:")} ${chalk.grey(adminSecret)}
     `
    );
  }
}
