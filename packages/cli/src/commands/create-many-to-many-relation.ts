import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";

export default class CreateManyToManyRelation extends Command {
  static description = "Create many to many relation";
  static examples = [
    `$ qore create-many-to-many-relation tableOrigin tableTarget`
  ];
  static args = [{ name: "tableOrigin" }, { name: "tableTarget" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey", required: true })
  };

  async run() {
    const { args, flags } = this.parse(CreateManyToManyRelation);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    const { tableOrigin, tableTarget } = args;
    cli.action.start(
      `Create many-to-many-relation for ${chalk.blue(
        `"${tableOrigin}"`
      )} and ${chalk.blue(`"${tableTarget}`)} table`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.ManyToManyRelation,
          migration: {
            name: "relationName",
            origin: { table: tableOrigin },
            target: { table: tableTarget },
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
