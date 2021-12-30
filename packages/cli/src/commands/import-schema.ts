import { DefaultApi, Configuration } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import config from "../config";
import path from "path";
import fs from "fs";

interface Migration {
  id: number;
  name: string;
  active: boolean;
  schema: object;
  up: string;
  down: string;
  createdAt: number;
  description?: string;
}

type Migrations = Migration[];

export default class ImportSchema extends Command {
  static description =
    "Import-schema in specific folder for other database architecture";
  static examples = [`$ qore import-schema --location`];

  static flags = {
    location: flags.string({
      char: "l",
      description: "fileLocation",
      default: "migrations"
    })
  };

  async getMigrationsDataInDB(client: any): Promise<Migrations> {
    try {
      const { data } = await client.getMigrations();
      return data.items;
    } catch (err) {
      this.error(`\n${chalk.red(`\n"${err}"`)}\n\n`);
    }
  }

  async getLatestMigrationID(client: object): Promise<number> {
    const data = await this.getMigrationsDataInDB(client);
    const id = data[data.length - 1].id;
    return id;
  }

  async run() {
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );
    const { flags } = this.parse(ImportSchema);
    const location = path.resolve(path.join(process.cwd(), flags.location));
    fs.readdir(location, async (err, files) => {
      try {
        if (err) return this.error(err);
        this.log(`\n${chalk.yellow(`\nRunning import-schema`)} ...\n`);
        const latestID = await this.getLatestMigrationID(client);
        const operations = [];
        files.sort(
          (a: string, b: string) => +a.split("-")[0] - +b.split("-")[0]
        );
        files.splice(0, 6);
        for (const file of files) {
          const jsonFile = await import(`${location}/${file}`);
          const { id, name, schema } = jsonFile.default;

          if (id > latestID) {
            operations.push(schema);
            this.log(`${chalk.grey(`#ID-${id} - ${name}`)}`);
          }
        }

        await client.migrate({
          operations
        });

        this.log(`${chalk.green("\nSuccess\n\n")}`);
      } catch (err) {
        this.error(`\n${chalk.red(`\n"${err}"`)}\n\n`);
      }
    });
  }
}
