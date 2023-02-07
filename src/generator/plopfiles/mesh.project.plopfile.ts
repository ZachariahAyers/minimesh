import type { NodePlopAPI } from "plop";
import type { Answers } from "inquirer";
import path from "path";
import { spawnCommand } from "../mesh.spawn";
import { CONSTANTS } from "../../constants/mesh.constants";
import { getRandomColor, getRandomSalutation } from "../common/common";

/**
 * Generate a new MiniMesh Project.
 * @param {NodePlopAPI} plop - The plop instance.
 * @author Zach Ayers
 */
export default function (plop: NodePlopAPI) {
  plop.setPartial("randomSalutation", getRandomSalutation());
  plop.setPartial("randomColor", getRandomColor());

  plop.setGenerator("MiniMesh Project", {
    description: "Generate a base MiniMesh Project",
    prompts: [
      {
        type: "input",
        name: "PROJECT_NAME",
        message: "What is the name of your project?",
      },
    ],
    actions: [
      // Project Files
      {
        type: "addMany",
        destination: path.join(process.cwd(), "{{ PROJECT_NAME}}"),
        base: "../templates/project",
        templateFiles: "../templates/project",
        stripExtensions: ["hbs"],
        globOptions: {
          dot: true,
        },
      },
      // Local ENV file
      {
        type: "add",
        path: path.join(process.cwd(), "{{PROJECT_NAME}}", ".env.local"),
        template: Object.keys(CONSTANTS.env)
          .filter((key) => CONSTANTS.env[key].value !== undefined)
          .map((key) => {
            return CONSTANTS.env[key].key + "=" + CONSTANTS.env[key].value;
          })
          .join("\n"),
      },
      (answers: Answers) => {
        const projectName = answers.PROJECT_NAME;
        spawnCommand(
          `cd ${projectName} && npm install minimesh@next --save-exact`
        );
        return "";
      },
      // TODO: print completion message
    ],
  });
}
