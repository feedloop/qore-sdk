import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";
import config from "../config";

export default class CreateColumn extends Command {
  static description = "Create new columns in specific table";

  static examples = [
    `$ qore create-columns --table todo --columns title:text,status:boolean`
  ];

  static flags = {
    table: flags.string({ description: "tableName", required: true }),
    columns: flags.string({ description: "columnName:type", required: true })
  };

  async run() {
    const { flags } = this.parse(CreateColumn);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const columns = flags.columns.split(",");
    const operations = [];
    for (const column of columns) {
      const [name, type] = column.split(":");
      operations.push({
        operation: V1MigrateOperationsOperationEnum.Create,
        resource: V1MigrateOperationsResourceEnum.Column,
        migration: {
          name,
          table: flags.table,
          column: {
            type
          }
        }
      });
    }
    this.log(`${chalk.yellow(`\nRunning process ....\n`)}`);

    await client.migrate({
      operations
    });

    for (let i = 0; i < operations.length; i++) {
      const { name } = operations[i].migration;
      const { type } = operations[i].migration.column;
      this.log(`${chalk.grey(`#${i + 1} Create-column ${name}:${type}`)}`);
    }

    this.log(
      `\n${chalk.grey("\nCreate columns in table")} ${chalk.blue(
        `"${flags.table}"`
      )} ${chalk.grey("...")}`
    );
    this.log(`${chalk.green("\nSuccess\n\n")}`);
  }
}
