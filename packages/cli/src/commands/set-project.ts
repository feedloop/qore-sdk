import { Command, flags } from "@oclif/command";
import { default as makeUser } from "@feedloop/qore-sdk/lib/user";
import prompts from "prompts";
import config from "../config";
import { promptFlags, tokenFlag } from "../flags";

export default class SetProject extends Command {
  static description = "Set project target";

  static examples = [`$ qore set-project`];

  static flags = {
    token: tokenFlag
  };

  async run() {
    const { args, flags } = this.parse(SetProject);
    const configs = await promptFlags(flags, SetProject.flags);
    try {
      const user = makeUser();
      user.setToken(configs.token);
      const orgs = await user.organizations();
      const { organizationId } = await prompts([
        {
          name: "organizationId",
          type: "select",
          message: "Select organization",
          choices: orgs.map(org => ({ title: org.name, value: org.id }))
        }
      ]);
      const org = await user.organization(organizationId);
      const { projects } = await org.projects();
      const { projectId } = await prompts([
        {
          name: "projectId",
          type: "select",
          message: "Select project",
          choices: projects.map(project => ({
            title: project.name,
            value: project.id
          }))
        }
      ]);
      config.set("project", projectId);
      config.set("org", organizationId);
      const project = projects.find(p => p.id === projectId);
      const organization = orgs.find(o => o.id === organizationId);
      this.log(
        `Successfully set project to ${project?.name} of the ${organization?.name} organization`
      );
    } catch (error) {
      this.error("Failed to set project", { exit: 100 });
    }
  }
}
