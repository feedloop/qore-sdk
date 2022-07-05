import {
  DefaultApi,
  Configuration,
  MigrateRequestOperationsInnerOperationEnum,
  MigrateRequestOperationsInnerResourceEnum
} from "@qorebase/sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import config from "../config";

interface Operation {
  operation: string;
  resource: string;
  migration: {
    name: string;
    deletionProtection: boolean;
  };
}
export default class CreateRole extends Command {
  static description = "Create new roles";

  static examples = [`$ qore create-roles user,engineer`];

  static args = [{ name: "roles" }];

  async run() {
    const { args } = this.parse(CreateRole);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    const roles = args.roles.split(",");
    const operations = roles.map((role: string, i: number) => {
      return {
        operation: MigrateRequestOperationsInnerOperationEnum.Create,
        resource: MigrateRequestOperationsInnerResourceEnum.Role,
        migration: {
          name: role,
          deletionProtection: false
        }
      };
    });

    this.log(`${chalk.yellow(`\nCreate roles `)}...\n`);
    await client.migrate({
      operations
    });

    operations.forEach((operation: Operation, i: number) => {
      this.log(
        `${chalk.grey(`#${i + 1} Create-role ${operation.migration.name}`)}`
      );
    });

    this.log(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
