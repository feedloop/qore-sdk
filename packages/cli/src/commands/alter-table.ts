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
  static args = [{ name: "former table name" }, { name: "new table name" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey" })
  };

  async run() {
    const { argv, flags } = this.parse(AlterTable);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(`${chalk.yellow("Rename table ...")}`, "initializing", {
      stdout: true
    });
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Table,
          migration: { from: `${argv[0]}`, to: `${argv[1]}` }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
