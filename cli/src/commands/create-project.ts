import { Command, flags } from "@oclif/command";
import prettier from "prettier";
import { asSequence } from "sequency";
import makeProject, {
  FieldType,
  Table,
  Vield,
  ViewSummary,
} from "@qore/sdk/lib/project/index";
import makeUser from "@qore/sdk/lib/user";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import config, { CLIConfig } from "../config";
import { configFlags, orgFlag, promptFlags, tokenFlag } from "../flags";
import { QoreSchema, TableSchema, ViewSchema } from "../types";
import { AxiosError } from "axios";
import dir from "node-dir";
export default class CreateProject extends Command {
  static description = "create a project from scratch or qore-schema.json";

  static examples = [`$ qore `];

  static templatesLocation = path.resolve(__dirname, "../../templates/");

  static flags = {
    token: tokenFlag,
    org: orgFlag,
    template: flags.string({
      char: "t",
      name: "template",
      description: "qore project template",
      default: "todo-list-typescript",
    }),
  };

  static args = [{ name: "name" }];

  static getTemplates() {
    const templates = fs
      .readdirSync(CreateProject.templatesLocation)
      .filter((file) =>
        fs
          .lstatSync(path.resolve(CreateProject.templatesLocation, file))
          .isDirectory()
      );
    return templates;
  }

  async run() {
    const { args, flags } = this.parse(CreateProject);
    const configs = await promptFlags(flags, CreateProject.flags);
    const templates = CreateProject.getTemplates();
    if (templates.indexOf(configs.template) === -1) {
      this.error(
        `Cant find "${configs.template}" from project templates, may want to choose from the following available templates: ${templates}`
      );
    }
    const destination: string = path.resolve(
      process.cwd(),
      args.name || "qore-project"
    );
    fse.copySync(
      path.resolve(CreateProject.templatesLocation, configs.template),
      destination
    );

    fse.writeJSONSync(
      path.resolve(destination, "qore.config.json"),
      {
        version: "v1",
        endpoint: "https://qore-api.feedloop.io",
        project: "some-project-id",
        org: "some-org-id",
      },
      { spaces: 2 }
    );
  }
}
