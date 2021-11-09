import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";

export default class CreateRole extends Command {
  static description = "Create new role";
  static examples = [`$ qore create-role roleName`];
  static args = [{ name: "roleName" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(CreateRole);
    cli.action.start(
      `Create new role ${chalk.blue(`"${args.roleName}"`, "initializing", {
        stdout: true
      })}`
    );
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Role,
          migration: {
            name: args.roleName,
            deletionProtection: true
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("success")}`);
  }
}
