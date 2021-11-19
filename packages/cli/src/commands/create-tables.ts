import { Command } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import cli from "cli-ux";
import chalk from "chalk";
import config from "../config";

export default class CreateTable extends Command {
  static description = "Create tables";

  static examples = [
    `$ qore create-tables todos`,
    `$ qore create-tables todos,projects`
  ];

  static args = [{ name: "tablesName", description: "list of table name" }];

  async run() {
    const { args } = this.parse(CreateTable);
    const listTables = args.tablesName.split(",");
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    cli.action.start(
      `${chalk.grey(`\nCreate table "${listTables}"`)}`,
      "initializing",
      { stdout: true }
    );

    for (let table of listTables) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum.Table,
            migration: {
              name: table
            }
          }
        ]
      });
    }

    cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
