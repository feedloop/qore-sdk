import { Command } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class OpenDoc extends Command {
  static description = "Open project doc on browser";

  static examples = [`$ qore open-doc`];

  async run() {
    const url = config.get("url");
    const parsedUrl = url + `/documentation`;
    this.log(`\n\n ${chalk.blue(`opening ${url} on browser....`)} \n\n`);
    await cli.open(parsedUrl);
  }
}
