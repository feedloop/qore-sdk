import {
  Configuration,
  DefaultApi,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";

export default class AlterTable extends Command {
  static description = "Rename specific table";
  static examples = [`$ qore alter-table formerName newName`];
  static args = [{ name: "formerName" }, { name: "newName" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(AlterTable);
    const { formerName, newName } = args;
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `Renaming table ${chalk.blue(`"${formerName}"`)} to ${chalk.blue(
        `"${newName}"`
      )}`,
      "initializing",
      {
        stdout: true
      }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Table,
          migration: { from: formerName, to: newName }
        }
      ]
    });
    cli.action.stop();
  }
}
