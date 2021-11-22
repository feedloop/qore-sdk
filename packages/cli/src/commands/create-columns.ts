import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";
import config from "../config";

interface Operation {
  operation: string;
  resource: string;
  migration: {
    name: string;
    table: string;
    column: {
      type: string;
    };
  };
}

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
    const operations = columns.map((column: string, i: number) => {
      const [name, type] = column.split(":");
      return {
        operation: V1MigrateOperationsOperationEnum.Create,
        resource: V1MigrateOperationsResourceEnum.Column,
        migration: {
          name,
          table: flags.table,
          column: {
            type
          }
        }
      };
    });

    this.log(`\n${chalk.yellow("\nCreate columns ")}...\n`);
    await client.migrate({
      operations
    });

    operations.forEach((operation: Operation, i: number) => {
      const { name } = operation.migration;
      const { type } = operation.migration.column;
      this.log(`${chalk.grey(`#${i + 1} Create-column ${name}:${type}`)}`);
    });

    this.log(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
