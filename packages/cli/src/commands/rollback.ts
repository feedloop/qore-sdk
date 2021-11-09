import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import inquirer from "inquirer";
import cli from "cli-ux";

export default class Rollback extends Command {
  static description = "Rollback to previous migration";
  static examples = [`$ qore rollback`];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { flags } = this.parse(Rollback);

    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `${chalk.blue("Rollback")} to previous migration ...`,
      "initializing",
      {
        stdout: true
      }
    );
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "migrateDown",
        message: `Are you sure want to revert to previous migration?`,
        default: false
      }
    ]);

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
