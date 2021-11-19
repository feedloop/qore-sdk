import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import inquirer from "inquirer";
import cli from "cli-ux";
import config from "../config";

export default class DropRole extends Command {
  static description = "Drop some roles";

  static examples = [
    `$ qore drop-roles users,engineer`,
    `$ qore drop-roles developer`
  ];

  static args = [{ name: "roles", description: "list role name" }];

  async run() {
    const { args } = this.parse(DropRole);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    const roles = args.roles.split(",");
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropRole",
        message: `Are you sure to delete role ${chalk.blue(`"${roles}"`)} ?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey(`Drop role "${roles}"`)}`,
      "initializing",
      { stdout: true }
    );
    if (response.dropRole) {
      for (let role of roles) {
        await client.migrate({
          operations: [
            {
              operation: V1MigrateOperationsOperationEnum.Drop,
              resource: V1MigrateOperationsResourceEnum.Role,
              migration: { name: role }
            }
          ]
        });
      }
      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
