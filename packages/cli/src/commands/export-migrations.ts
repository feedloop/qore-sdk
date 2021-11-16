import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import { writeFile } from "fs";
import config from "../config";
import chalk from "chalk";
import cli from "cli-ux";
import path from "path";

export default class ExportMigrations extends Command {
  static description = "Populate json file for all migrations process";

  static examples = [`$ qore export-migrations location limit offset`];

  static flags = {
    limit: flags.string({ description: "limit" }),
    offset: flags.string({ description: "offset" }),
    location: flags.string({ description: "fileLocation" })
  };

  async run() {
    const { flags } = this.parse(ExportMigrations);
    const limit = flags.limit ? Number(flags.limit) : undefined;
    const offset = flags.offset ? Number(flags.offset) : undefined;
    const loc = flags.location ? `./${flags.location}` : ".";
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `${chalk.blue("Creating file migrations")}`,
      "initializing",
      { stdout: true }
    );

    const { data } = await client.getMigrations(limit, offset);

    for (let item of data.items) {
      this.log(
        `${chalk.grey(
          `#${item.id} ${new Date(item.createdAt).toISOString()}-${item.name}`
        )}`
      );
      writeFile(
        path.resolve(
          `${loc}/`,
          `${item.id}-${new Date(item.createdAt).toISOString()}.json`
        ),
        JSON.stringify(item, null, 2),
        {
          encoding: "utf8",
          flag: "w",
          mode: 0o666
        },
        err => {
          if (err) return this.log(`${chalk.red(err)}`);
        }
      );
    }
  }
}
