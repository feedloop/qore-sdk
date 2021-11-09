import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";

export default class AlterRole extends Command {
  static description = "Alter role";
  static examples = [`$ qore alter-role formerName newName`];
  static args = [{ name: "formerName" }, { name: "newName" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(AlterRole);
    const { formerName, newName } = args;
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `Alter role ${chalk.blue(
        `"${formerName}"`
      )} to ${chalk.blue(`"${newName}"`, "initializing", { stdout: true })}`
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Role,
          migration: { from: formerName, to: newName }
        }
      ]
    });
    cli.action.stop(`${chalk.green("success")}`);
  }
}
