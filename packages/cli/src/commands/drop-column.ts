import { Command } from "@oclif/command";
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

  static examples = [`$ qore drop-column tableName columnName`];

  static args = [{ name: "tableName" }, { name: "columnName" }];

  async run() {
    const { args } = this.parse(DropColumn);
    const { tableName, columnName } = args;
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
      `Drop column ${chalk.blue(`"${columnName}"`)} from table ${chalk.blue(
        `"${tableName}"`
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
            migration: { table: tableName, column: columnName }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}
