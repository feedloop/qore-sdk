import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@qorebase/sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";
import config from "../config";

export default class AlterColumn extends Command {
  static description = "Rename column from specific table";

  static example = `$ qore alter-column formerName newName --table tableName`;

  static args = [{ name: "formerName" }, { name: "newName" }];
  static flags = {
    table: flags.string({ description: "tableName", required: true })
  };
  async run() {
    const { args, flags } = this.parse(AlterColumn);
    const { formerName, newName } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    cli.action.start(
      `\n${chalk.grey(
        `Renaming column "${formerName}" to "${newName}" in "${flags.table}" table`
      )}`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: { from: formerName, to: newName, table: flags.table }
        }
      ]
    });

    cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
