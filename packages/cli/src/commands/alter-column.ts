import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";
import config from "../config";

export default class AlterColumn extends Command {
  static description = "Rename column from specific table";

  static example = `$ qore tableName formerName newName`;

  static args = [
    { name: "tableName" },
    { name: "formerName" },
    { name: "newName" }
  ];

  async run() {
    const { args } = this.parse(AlterColumn);
    const { tableName, formerName, newName } = args;
    cli.action.start(
      `Renaming column ${chalk.blue(`"${formerName}"`)} to ${chalk.blue(
        `"${newName}"`
      )} in ${chalk.blue(`"${tableName}"`)} table`,
      "initializing",
      {
        stdout: true
      }
    );
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: { from: formerName, to: newName, table: tableName }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
