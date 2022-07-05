import { Command } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  MigrateRequestOperationsInnerOperationEnum,
  MigrateRequestOperationsInnerResourceEnum
} from "@qorebase/sdk";
import chalk from "chalk";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";

interface Operation {
  operation: string;
  resource: string;
  migration: { name: string };
}
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
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
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

    cli.action.start(`\n${chalk.yellow(`Drop tables `)}`, "initializing", {
      stdout: true
    });

    if (confirmation.dropTables) {
      const operations = listTables.map((table: string) => {
        return {
          operation: MigrateRequestOperationsInnerOperationEnum.Drop,
          resource: MigrateRequestOperationsInnerResourceEnum.Table,
          migration: { name: table }
        };
      });

      await client.migrate({
        operations
      });

      operations.forEach((operation: Operation, i: number) => {
        this.log(
          `${chalk.grey(`#${i + 1} Drop-table ${operation.migration.name}`)}`
        );
      });

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
