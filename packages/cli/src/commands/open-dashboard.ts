import { Command } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class OpenDashboard extends Command {
  static description = "Open project dashboard on browser";

  static examples = [`$ qore open-dashboard`];

  async run() {
    const url = config.get("url");
    this.log(`\n\n ${chalk.blue(`opening ${url} on browser....`)} \n\n`);
    await cli.open(url);
  }
}
