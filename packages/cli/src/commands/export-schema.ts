import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import config from "../config";
import chalk from "chalk";
import path from "path";
import fs from "fs";

export default class ExportSchema extends Command {
  static description = "Populate json file for all migrations process";

  static examples = [`$ qore export-schema --location migrations`];

  static flags = {
    location: flags.string({
      description: "fileLocation",
      default: "migrations"
    })
  };

  async run() {
    const { flags } = this.parse(ExportSchema);
    const location = path.resolve(path.join(process.cwd(), flags.location));
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const isExist = fs.existsSync(location);
    if (!isExist) {
      fs.mkdirSync(location);
    }

    this.log(`${chalk.yellow("\n\nRunning process")} ...\n`);
    const { data } = await client.getMigrations();
    for (let item of data.items) {
      this.log(
        `${chalk.grey(
          `#${item.id} ${new Date(item.createdAt).toISOString()}-${item.name}`
        )}`
      );
      fs.writeFile(
        `${location}/${item.id}-${new Date(item.createdAt).toISOString()}.json`,
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
    this.log(`${chalk.grey("\n\nExport file migrations")} ...`);
    this.log(`${chalk.green("Success\n\n")}`);
  }
}
