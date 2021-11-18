import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import config from "../config";
import chalk from "chalk";
import path from "path";
import fs from "fs";

interface Operation {
  id: number;
  name: string;
  active: boolean;
  schema: object;
  up: string;
  down: string;
  createdAt: number;
  description?: string;
}

type Operations = Operation[];

export default class ExportSchema extends Command {
  static description = "Populate json file for all migrations process";

  static examples = [`$ qore export-schema --location migrations`];

  static flags = {
    location: flags.string({
      description: "fileLocation",
      default: "migrations"
    })
  };

  async mkdirLocation(location: string) {
    const isExist = fs.existsSync(location);
    if (!isExist) {
      fs.mkdirSync(location);
    }
  }

  async getDataMigrations(client: any): Promise<Operations> {
    const { data } = await client.getMigrations();
    return data.items;
  }

  async exportFile(location: string, data: Operations) {
    data.forEach(file => {
      this.log(
        `${chalk.grey(
          `#${file.id} ${new Date(file.createdAt).toISOString()}-${file.name}`
        )}`
      );

      fs.writeFile(
        `${location}/${file.id}-${new Date(file.createdAt).toISOString()}.json`,
        JSON.stringify(file, null, 2),
        {
          encoding: "utf8",
          flag: "w",
          mode: 0o666
        },
        err => {
          if (err) return this.log(`${chalk.red(err)}`);
        }
      );
    });
  }

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    const { flags } = this.parse(ExportSchema);
    const location = path.resolve(path.join(process.cwd(), flags.location));

    await this.mkdirLocation(location);
    this.log(`${chalk.yellow("\n\nRunning process")} ...\n`);
    const data = await this.getDataMigrations(client);
    await this.exportFile(location, data);
    this.log(`${chalk.grey("\n\nExport file migrations")} ...`);
    this.log(`${chalk.green("Success\n\n")}`);
  }
}
