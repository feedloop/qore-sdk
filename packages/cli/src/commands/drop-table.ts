// belum validasi dulu apakah table nya bener ada di db
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";

export default class DropTable extends Command {
  static description = "Drop specific table";
  static examples = [`$ qore drop-table tableName`];
  static args = [{ name: "table name" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey" })
  };

  async run() {
    const { argv, flags } = this.parse(DropTable);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    const validation = await cli.prompt("Are you sure? Y|N");
    const response = validation.toLowerCase();
    cli.action.start(`${chalk.yellow("Drop table ...")}`, "initializing", {
      stdout: true
    });
    if (response === "y" || response === "yes") {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Table,
            migration: { name: argv[0] }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else if (response === "n" || response === "no") {
      cli.action.stop(`${chalk.red("Cancell")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}
