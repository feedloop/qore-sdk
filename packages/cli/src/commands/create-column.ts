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

export default class CreateColumn extends Command {
  static description = "Create column in specific table";

  static examples = [`$ qore create-column tableName columnName dataType`];

  static args = [
    { name: "tableName" },
    { name: "columnName" },
    { name: "dataType" }
  ];

  async run() {
    const { args } = this.parse(CreateColumn);
    const { tableName, columnName, dataType } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `Create new column ${chalk.blue(`"${columnName}"`)} in ${chalk.blue(
        `"${tableName}"`
      )} table `,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: {
            table: tableName,
            name: columnName,
            column: {
              type: dataType,
              definition: {
                textType: dataType,
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
