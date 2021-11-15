import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";

export default class DropTable extends Command {
  static description = "Drop specific table";

  static examples = [`$ qore drop-table tableName`];

  static args = [{ name: "tableName" }];

  async run() {
    const { args } = this.parse(DropTable);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropTable",
        message: `Are you sure to delete ${chalk.blue(
          `"${args.tableName}"`
        )} table ?`,
        default: false
      }
    ]);

    cli.action.start(
      `Drop table ${chalk.blue(`"${args.tableName}"`)}`,
      "initializing",
      { stdout: true }
    );
    if (response.dropTable) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Table,
            migration: { name: args.tableName }
          }
        ]
      });

      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}