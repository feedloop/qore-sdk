import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class CreateRole extends Command {
  static description = "Create new role";

  static examples = [`$ qore create-role roleName`];

  static args = [{ name: "roleName" }];

  async run() {
    const { args } = this.parse(CreateRole);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `Create new role ${chalk.blue(`"${args.roleName}"`)}`,
      "initializing",
      { stdout: true }
    );

    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Role,
          migration: {
            name: args.roleName,
            deletionProtection: false
          }
        }
      ]
    });

    cli.action.stop(`${chalk.green("Success")}`);
  }
}
