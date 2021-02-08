import { Command, flags } from "@oclif/command";
import simpleGit from "simple-git";
import makeProject, {
  QoreProjectSchema
} from "@feedloop/qore-sdk/lib/project/index";
import makeUser from "@feedloop/qore-sdk/lib/user";
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
    const git = simpleGit();
    const destination: string = path.resolve(
      process.cwd(),
      args.name || "qore-project"
    );

    if (templates.indexOf(configs.template) === -1) {
      try {
        await git.clone(configs.template, destination);
        const packageJson = await fse.readJson(
          path.resolve(destination, "package.json")
        );
        const isQoreProject = await fse.pathExists(
          path.resolve(
            destination,
            packageJson?.qoreconfig?.path || "",
            "qore.schema.json"
          )
        );
        if (!isQoreProject) {
          await fse.unlink(destination);
          throw new Error("Invalid template");
        }
      } catch (error) {
        this.error(
          `"${configs.template}" is not a valid template, please check if it is a qore project or choose from the following available templates: ${templates}`
        );
      }
    } else {
      fse.copySync(
        path.resolve(CreateProject.templatesLocation, configs.template),
        destination
      );
    }

    const user = makeUser();
    user.setToken(configs.token);

    const org = await user.organization(configs.org);
    const packageJson = await fse.readJson(
      path.resolve(destination, "package.json")
    );
    const configPath = path.resolve(
      destination,
      packageJson?.qoreconfig?.path || ""
    );
    const schemaFile = fse.readJSONSync(
      path.resolve(configPath, "qore.schema.json")
    ) as QoreProjectSchema;
    const projectId = await org.createProject({
      name: args.name,
      schema: schemaFile
    });
    config.set("org", org.id);
    config.set("project", projectId);
    await Codegen.writeConfigFile(
      { ...configs, project: projectId },
      configPath
    );
    this.log("New project initialized on", destination);
  }
}
