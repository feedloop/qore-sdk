import { Command, flags } from "@oclif/command";
import prompts from "prompts";
import axios from "../axios";
import config from "../config";

export default class Codegen extends Command {
  static description = "Generate typescript definition file";

  static examples = [`$ qore codegen`];

  static flags = {
    email: flags.string({ char: "p", description: "project id" }),
  };

  async run() {
    const values = await prompts([
      { name: "email", type: "text", message: "Enter your email" },
      { name: "password", type: "password", message: "Enter your password" },
    ]);
    try {
      const resp = await axios.post<{ email: string; token: string }>(
        "/login",
        {
          email: values.email,
          password: values.password,
        }
      );
      config.set("accessToken", resp.data.token);
      this.log(`Logged in as ${resp.data.email}`);
    } catch (error) {
      this.error("Invalid login credentials", { exit: 100 });
    }
  }
}
