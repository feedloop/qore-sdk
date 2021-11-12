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

export default class CreateRelation extends Command {
  static description =
    "Create relation 1:m for one-to-many or m:n for many-to-many relation";

  static examples = [
    `$ qore create-relation relationType tableOrigin tableTarget relationName`
  ];

  static args = [
    { name: "relationType" },
    { name: "tableOrigin" },
    { name: "tableTarget" }
  ];

  static flags = {
    relationName: flags.string({ description: "relationName" })
  };

  async run() {
    const { args, flags } = this.parse(CreateRelation);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    const { relationType, tableOrigin, tableTarget } = args;

    let relationName = "";
    if (!flags.relationName) {
      relationName = `${tableOrigin}${
        tableTarget.charAt(0).toUpperCase() + tableTarget.slice(1)
      }`;
    } else relationName = flags.relationName;

    let statement = "";
    let typeOfRelation: string =
      relationType.toLowerCase() === "1:m"
        ? "OneToManyRelation"
        : "ManyToManyRelation";

    if (typeOfRelation === "OneToManyRelation") {
      statement = `Create ${typeOfRelation} ${chalk.blue(
        `"${relationName}`
      )} from ${chalk.blue(`"${tableOrigin}"`)} table to ${chalk.blue(
        `"${tableTarget}`
      )} table`;
      cli.action.start(`${statement}`, "initializing", { stdout: true });
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum[typeOfRelation],
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
    } else if (typeOfRelation === "ManyToManyRelation") {
      statement = `Create tableJunction ${chalk.blue(
        `"${relationName}"`
      )} ${typeOfRelation} for ${chalk.blue(
        `"${tableOrigin}"`
      )} and ${chalk.blue(`"${tableTarget}`)} table`;
      cli.action.start(`${statement}`, "initializing", { stdout: true });
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum[typeOfRelation],
            migration: {
              name: relationName,
              origin: { table: tableOrigin },
              target: { table: tableTarget },
              nullable: true,
              onUpdate: "SET NULL",
              onDelete: "SET NULL"
            }
          }
        ]
      });
    }
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
