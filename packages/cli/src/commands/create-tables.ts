import { Command } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@qorebase/sdk";
import chalk from "chalk";
import config from "../config";

interface Operation {
  operation: string;
  resource: string;
  migration: {
    name: string;
  };
}

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
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    const operations = listTables.map((table: string) => {
      return {
        operation: V1MigrateOperationsOperationEnum.Create,
        resource: V1MigrateOperationsResourceEnum.Table,
        migration: {
          name: table
        }
      };
    });

    this.log(`\n${chalk.yellow(`\nCreate tables `)}...\n`);
    await client.migrate({
      operations
    });

    operations.forEach((operation: Operation, i: number) => {
      this.log(
        `${chalk.grey(`#${i + 1} Create-table ${operation.migration.name}`)}`
      );
    });

    this.log(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
