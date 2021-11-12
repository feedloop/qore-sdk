import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import inquirer from "inquirer";
import cli from "cli-ux";
import config from "../config";

export default class Rollback extends Command {
  static description = "Rollback to previous migration";

  static examples = [`$ qore rollback`];

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "migrateDown",
        message: `Are you sure to revert to previous migration?`,
        default: false
      }
    ]);

    cli.action.start(
      `${chalk.blue("Rollback")} to previous migration ...`,
      "initializing",
      { stdout: true }
    );

    if (response.migrateDown) {
      await client.rollback({
        rollbacks: 1
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.green("Failed")}`);
    }
  }
}
