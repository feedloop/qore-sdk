import { Command } from "@oclif/command";
import prettier from "prettier";
import createProject, { QoreProjectSchema } from "@qore/sdk/lib/project/index";
import fs from "fs";
import path from "path";
import { CLIConfig } from "../config";
import { configFlags, promptFlags } from "../flags";

export default class ExportSchema extends Command {
  static description = "export the schema of a given project";

  static examples = [`$ qore `];

  static flags = {
    ...configFlags
  };

  static args = [{ name: "file" }];

  static async getSchema(configs: CLIConfig): Promise<QoreProjectSchema> {
    const project = createProject({
      organizationId: configs.org,
      projectId: configs.project,
      token: configs.token
    });
    const schema = await project.exportSchema();
    return schema;
  }

  async run() {
    const { args, flags } = this.parse(ExportSchema);
    const configs = await promptFlags(flags, ExportSchema.flags);
    const schema = await ExportSchema.getSchema(configs);
    fs.writeFileSync(
      path.resolve(process.cwd() + "/qore-schema.json"),
      prettier.format(JSON.stringify(schema), { parser: "json" }),
      {
        encoding: "utf8"
      }
    );
  }
}
