import { Command } from "@oclif/command";
import chalk from "chalk";

export default class Ping extends Command {
  static description = "Ping";

  static examples = [`$ qore ping`];

  async run() {
    this.log(`\n\n${chalk.blue("PONG")}\n\n`);
  }
}
