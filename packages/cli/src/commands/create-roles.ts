import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import config from "../config";

export default class CreateRole extends Command {
  static description = "Create new roles";

  static examples = [`$ qore create-roles user,engineer`];

  static args = [{ name: "roles" }];

  async run() {
    const { args } = this.parse(CreateRole);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    this.log(`\n${chalk.yellow("Running process....\n")}`);

    const roles = args.roles.split(",");

    for (let i = 0; i < roles.length; i++) {
      const roleName = roles[i];
      this.log(`${chalk.grey(`#${i + 1} Create-role ${roleName}`)}`);
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum.Role,
            migration: {
              name: roleName,
              deletionProtection: false
            }
          }
        ]
      });
    }

    this.log(`\n${chalk.grey("\nCreate roles ...")}`);
    this.log(`${chalk.green("\nSuccess\n\n")}`);
  }
}
