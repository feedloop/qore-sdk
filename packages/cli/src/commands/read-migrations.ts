import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import config from "../config";
import chalk from "chalk";

export default class ReadMigration extends Command {
  static description = "Read/see migrations histories";

  static examples = [`$ qore read-migrations`];

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    this.log(`\n\n${chalk.yellow("Migration histories:")}\n`);

    const { data } = await client.getMigrations();
    for (let item of data.items) {
      this.log(
        `${chalk.grey(
          `#${item.id} ${new Date(item.createdAt).toISOString()}-${item.name}`
        )}`
      );
    }

    this.log(`\n${chalk.green("Success\n\n")}`);
  }
}
