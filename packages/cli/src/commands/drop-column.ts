import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";
import inquirer from "inquirer";
import config from "../config";

export default class DropColumn extends Command {
  static description = "Drop column from specific table";

  static examples = [`$ qore drop-column columnName --table tableName`];

  static args = [{ name: "columnName" }];

  static flags = {
    table: flags.string({ description: "tableName", required: true })
  };

  async run() {
    const { args, flags } = this.parse(DropColumn);
    const { columnName } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropColumn",
        message: `Are you sure to delete ${chalk.blue(
          `"${columnName}"`
        )} column ?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey(
        `Drop column "${columnName}" from table "${flags.table}"`
      )}`,
      "initializing",
      { stdout: true }
    );

    if (response.dropColumn) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Column,
            migration: { table: flags.table, column: columnName }
          }
        ]
      });

      cli.action.stop(`${chalk.green("\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\nFailed\n\n")}`);
    }
  }
}
