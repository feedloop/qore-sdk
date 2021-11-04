import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";

export default class AlterColumn extends Command {
  static description = "Rename column from a specific table";
  static example = `$ qore tableName formerName newName`;
  static args = [
    { name: "tableName" },
    { name: "formerName" },
    { name: "newName" }
  ];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { flags, args } = this.parse(AlterColumn);
    const { tableName, formerName, newName } = args;
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `Renaming column ${chalk.blue(`"${formerName}"`)} to ${chalk.blue(
        `"${newName}"`
      )} from ${chalk.blue(`"${tableName}"`)} table`,
      "initializing",
      {
        stdout: true
      }
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
    cli.action.stop();
  }
}
