import config from "../config";
import { Command } from "@oclif/command";
import chalk from "chalk";

export default class Logout extends Command {
  static description = "Logout from qore cli";

  static examples = [`$ qore logout`];

  async run() {
    config.clear();
    // console.log(config, '================= logout config')
    this.log(`Logout ${chalk.green("success")} ... bye !`);
  }
}
