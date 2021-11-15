import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";
import chalk from "chalk";

export default class DropPermission extends Command {
  static description = "Drop permission for specific role";

  static examples = [`$ qore drop-permission roleName action`];

  static args = [{ name: "roleName" }, { name: "action" }];

  async run() {
    const { args } = this.parse(DropPermission);
    const { roleName, action } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropPermission",
        message: `Are you sure to remove ${chalk.blue(
          `"${action}"`
        )} permission for ${chalk.blue(`"${roleName}"`)}?`,
        default: false
      }
    ]);

    cli.action.start(
      `Drop ${chalk.blue(`"${action}"`)} permission for ${chalk.blue(
        `"${roleName}"`
      )} role`,
      "initializing",
      { stdout: true }
    );

    if (response.dropPermission) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Permission,
            migration: { role: roleName, action }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}
