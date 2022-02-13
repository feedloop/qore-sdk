import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import inquirer from "inquirer";
import cli from "cli-ux";
import config from "../config";

export default class Rollback extends Command {
  static description = "Rollback to previous migration";

  static examples = [`$ qore rollback 10`];

  static args = [{ name: "steps", description: "Number of Rollbacks" }];

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );
    const { args } = this.parse(Rollback);
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "migrateDown",
        message: `Are you sure to revert to previous migration ${args.steps} times?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey("Rollback to previous migration ")}`,
      "initializing",
      { stdout: true }
    );

    if (response.migrateDown) {
      await client.rollback({
        rollbacks: args.steps
      });

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
