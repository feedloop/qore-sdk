import { DefaultApi, Configuration } from "@qorebase/sdk";
import { Command, flags } from "@oclif/command";
import config from "../config";
import chalk from "chalk";

export default class ReadMigration extends Command {
  static description = "Read/see migrations histories";

  static examples = [`$ qore read-migrations --limit 0 --offset 0`];

  static flags = {
    limit: flags.integer({
      description: "limit",
      default: undefined
    }),
    offset: flags.integer({
      description: "offset",
      default: undefined
    })
  };

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    const { flags } = this.parse(ReadMigration);
    this.log(`\n\n${chalk.yellow("Migration histories:")}\n`);
    const { data } = await client.getMigrations(flags.limit, flags.offset, {});
    data.items.forEach(item => {
      this.log(
        `${chalk.grey(
          `#${item.id} ${new Date(item.createdAt).toISOString()}-${item.name}`
        )}`
      );
    });

    this.log(`\n${chalk.green("\nSuccess\n\n")}`);
  }
}
