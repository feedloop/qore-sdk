import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";
import inquirer from "inquirer";
import config from "../config";
import cli from "cli-ux";

interface Operation {
  operation: string;
  resource: string;
  migration: { table: string; column: string };
}

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
        name: "dropColumns",
        message: `Are you sure to delete ${chalk.blue(
          `"${listColumns}"`
        )} column ?`,
        default: false
      }
    ]);

    cli.action.start(`\n${chalk.yellow(`Drop columns `)}`, "initializing", {
      stdout: true
    });

    if (response.dropColumns) {
      const operations = listColumns.map((column: string) => {
        return {
          operation: V1MigrateOperationsOperationEnum.Drop,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: { table: flags.table, column }
        };
      });

      await client.migrate({
        operations
      });

      operations.forEach((operation: Operation, i: number) => {
        this.log(
          `${chalk.grey(`#${i + 1} Drop-column ${operation.migration.column}`)}`
        );
      });

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
