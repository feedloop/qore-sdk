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

export default class DropColumn extends Command {
  static description = "Drop column from specific table";
  static examples = [`$ qore drop-column tableName columnName`];
  static args = [{ name: "tableName" }, { name: "columnName" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(DropColumn);
    const { tableName, columnName } = args;
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
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
