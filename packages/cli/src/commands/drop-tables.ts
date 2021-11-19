import { Command } from "@oclif/command";
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

  static examples = [
    `$ qore drop-tables todos`,
    `$ qore drop-tables todos,projects`
  ];

  static args = [{ name: "tablesName", description: "list of table name" }];

  async run() {
    const { args } = this.parse(DropTable);
    const listTables = args.tablesName.split(",");
    console.log(listTables);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const confirmation = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropTables",
        message: `Are you sure to delete ${chalk.blue(
          `"${listTables}"`
        )} table ?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey(`Drop table "${listTables}"`)}`,
      "initializing",
      { stdout: true }
    );

    if (confirmation.dropTables) {
      for (const table of listTables) {
        await client.migrate({
          operations: [
            {
              operation: V1MigrateOperationsOperationEnum.Drop,
              resource: V1MigrateOperationsResourceEnum.Table,
              migration: { name: table }
            }
          ]
        });
      }

      cli.action.stop(`${chalk.green("\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\nFailed\n\n")}`);
    }
  }
}
