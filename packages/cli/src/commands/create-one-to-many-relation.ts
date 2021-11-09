import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";

export default class CreateOneToManyRelation extends Command {
  static description = "Create OneToManyRelation column";
  static examples = [
    `$ qore create-one-to-many-relation tableOrigin tableTarget relationName`
  ];
  static args = [{ name: "tableOrigin" }, { name: "tableTarget" }];
  static flags = {
    relationName: flags.string({ description: "relationName" }),
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(CreateOneToManyRelation);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    const { tableOrigin, tableTarget } = args;
    let relationName = "";
    if (!flags.relationName) {
      relationName = `${tableOrigin}${
        tableTarget.charAt(0).toUpperCase() + tableTarget.slice(1)
      }`;
    } else {
      relationName = flags.relationName;
    }
    cli.action.start(
      `Create one-to-many-relation ${chalk.blue(
        `"${relationName}`
      )} from ${chalk.blue(`"${tableOrigin}"`)} table to ${chalk.blue(
        `"${tableTarget}`
      )} table`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.OneToManyRelation,
          migration: {
            name: relationName,
            one: { table: tableOrigin },
            many: { table: tableTarget },
            nullable: true,
            onUpdate: "SET NULL",
            onDelete: "SET NULL"
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("success")}`);
  }
}
