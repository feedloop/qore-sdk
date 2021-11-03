import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import cli from "cli-ux";
import chalk from "chalk";

export default class CreateColumn extends Command {
  static description = "Create column in specific table";
  static examples = [`$ qore create-column tableName columnName dataType`];
  static args = [
    { name: "table name" },
    { name: "column name" },
    { type: "data type" }
  ];

  static flags = {
    apiKey: flags.string({ description: "apiKey user" })
  };
  async run() {
    const { flags, argv } = this.parse(CreateColumn);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `${chalk.yellow("Create new column ...")}`,
      "initializing",
      {
        stdout: true
      }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: {
            table: argv[0],
            name: argv[1],
            column: {
              type: argv[2],
              definition: {
                textType: argv[2],
                default: "",
                unique: false
              }
            }
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
