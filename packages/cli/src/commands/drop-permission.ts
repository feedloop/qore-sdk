import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";
import chalk from "chalk";

export default class DropPermission extends Command {
  static description =
    "Drop specific action in permissions table for specific role";

  static examples = [`$ qore drop-permission actionName --role user`];

  static args = [{ name: "action" }];

  static flags = {
    role: flags.string({ description: "roleName", required: true })
  };

  async run() {
    const { flags, args } = this.parse(DropPermission);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropPermission",
        message: `Are you sure to remove ${chalk.blue(
          `"${args.action}"`
        )} permission for ${chalk.blue(`"${flags.role}"`)}?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey("Drop")} ${chalk.blue(`"${args.action}"`)} ${chalk.grey(
        "permission for"
      )} ${chalk.blue(`"${flags.role}"`)}`,
      "initializing",
      { stdout: true }
    );

    if (response.dropPermission) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Permission,
            migration: { role: flags.role, action: args.action }
          }
        ]
      });

      cli.action.stop(`${chalk.green("\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\nFailed\n\n")}`);
    }
  }
}
