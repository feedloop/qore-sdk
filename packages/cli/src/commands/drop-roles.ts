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

interface Operation {
  operation: string;
  resource: string;
  migration: { name: string };
}

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
        name: "dropRoles",
        message: `Are you sure to delete role ${chalk.blue(`"${roles}"`)} ?`,
        default: false
      }
    ]);

    cli.action.start(`\n${chalk.yellow(`Drop roles `)}`, "initializing", {
      stdout: true
    });
    if (response.dropRoles) {
      const operations = roles.map((role: string) => {
        return {
          operation: V1MigrateOperationsOperationEnum.Drop,
          resource: V1MigrateOperationsResourceEnum.Role,
          migration: { name: role }
        };
      });

      await client.migrate({
        operations
      });

      operations.forEach((operation: Operation, i: number) => {
        this.log(
          `${chalk.grey(`#${i + 1} Drop-role ${operation.migration.name}`)}`
        );
      });
      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
