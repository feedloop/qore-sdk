import { Command, flags } from "@oclif/command";
import prettier from "prettier";
import makeProject, {
  QoreProjectSchema
} from "@feedloop/qore-sdk/lib/project/index";
import fse from "fs-extra";
import path from "path";
import config, { CLIConfig } from "../config";
import { configFlags, promptFlags } from "../flags";
import Codegen from "./codegen";

export default class ExportSchema extends Command {
  static description = "export the schema of a given project";

  static examples = [`$ qore export-schema`];

  static flags = {
    ...configFlags,
    path: flags.string({
      name: "path",
      description: "path",
      default: () => "./"
    })
  };

  static args = [{ name: "file" }];

  static async getSchema(configs: CLIConfig): Promise<QoreProjectSchema> {
    const project = makeProject({
      organizationId: configs.org,
      projectId: configs.project
    });
    await project.auth.signInWithUserToken(configs.token);
    const schema = await project.exportSchema();
    return schema;
  }

  async run() {
    const { args, flags } = this.parse(ExportSchema);
    const destination = path.resolve(process.cwd(), flags.path);
    const loadedConfig = await Codegen.loadConfigFromRc(destination);
    const configs = await promptFlags(
      { ...(loadedConfig || {}), ...flags },
      ExportSchema.flags
    );
    const schema = await ExportSchema.getSchema(configs);
    await fse.writeFile(
      path.resolve(destination, "qore.schema.json"),
      prettier.format(
        JSON.stringify({ WARNING: Codegen.warningMessage, ...schema }),
        { parser: "json" }
      ),
      {
        encoding: "utf8"
      }
    );
  }
}
