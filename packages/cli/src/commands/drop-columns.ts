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
  static description = "Drop columns from specific table";

  static examples = [`$ qore drop-columns title,status --table todos`];

  static args = [{ name: "columnsName", description: "list of column name" }];

  static flags = {
    table: flags.string({ description: "tableName", required: true })
  };

  async run() {
    const { args, flags } = this.parse(DropColumn);
    const listColumns = args.columnsName.split(",");

    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropColumn",
        message: `Are you sure to delete ${chalk.blue(
          `"${listColumns}"`
        )} column ?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey(
        `Drop column "${listColumns}" from table "${flags.table}"`
      )}`,
      "initializing",
      { stdout: true }
    );

    if (response.dropColumn) {
      for (let column of listColumns) {
        await client.migrate({
          operations: [
            {
              operation: V1MigrateOperationsOperationEnum.Drop,
              resource: V1MigrateOperationsResourceEnum.Column,
              migration: { table: flags.table, column }
            }
          ]
        });
      }

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
