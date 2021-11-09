import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import inquirer from "inquirer";
import cli from "cli-ux";

export default class DropRole extends Command {
  static description = "Drop specific role";
  static examples = [`$ qore drop-role roleName`];
  static args = [{ name: "roleName" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(DropRole);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(
      `Drop role ${chalk.blue(`"${args.roleName}"`)}`,
      "initializing",
      { stdout: true }
    );
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropRole",
        message: `Are you sure to delete role ${chalk.blue(
          `"${args.roleName}"`
        )} ?`,
        default: false
      }
    ]);

    if (response.dropRole) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Role,
            migration: { name: args.roleName }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.green("Failed")}`);
    }
  }
}
