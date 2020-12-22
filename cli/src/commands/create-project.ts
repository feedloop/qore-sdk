import { Command, flags } from "@oclif/command";
import makeProject, { QoreProjectSchema } from "@qore/sdk/lib/project/index";
import makeUser from "@qore/sdk/lib/user";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import config from "../config";
import { orgFlag, promptFlags, tokenFlag } from "../flags";
import Codegen from "./codegen";

export default class CreateProject extends Command {
  static description = "create a project from template";

  static examples = [
    `$ qore create-project --template todo-list-typescript your-project-name`
  ];

  static templatesLocation = path.resolve(__dirname, "../../templates/");

  static flags = {
    token: tokenFlag,
    org: orgFlag,
    template: flags.string({
      char: "t",
      name: "template",
      description: "qore project template",
      default: "todo-list-typescript"
    })
  };

  static args = [{ name: "name" }];

  static getTemplates() {
    const templates = fs
      .readdirSync(CreateProject.templatesLocation)
      .filter(file =>
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

    const user = makeUser();
    user.setToken(configs.token);

    const org = await user.organization(configs.org);
    const schemaFile = fse.readJSONSync(
      path.resolve(destination, "qore.schema.json")
    ) as QoreProjectSchema;
    const projectId = await org.createProject({
      name: args.name,
      schema: schemaFile
    });
    config.set("org", org.id);
    config.set("project", projectId);
    Codegen.writeConfigFile({ ...configs, project: projectId }, destination);
    this.log("New project initialized on", destination);
  }
}
