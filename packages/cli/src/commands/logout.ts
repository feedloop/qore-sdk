import config from "../config";
import { Command } from "@oclif/command";
import chalk from "chalk";

export default class Logout extends Command {
  static description = "Logout from qore cli";

  static examples = [`$ qore logout`];

  async run() {
    config.clear();
    this.log(`\n\n${chalk.grey("Logout")} ${chalk.green("success")} ...`);
    this.log(`\n${chalk.grey("bye !")}\n\n`);
  }
}
