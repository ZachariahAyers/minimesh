import type { NodePlopAPI } from "plop";
import path from "path";
import { getRandomColor, getRandomSalutation } from "../common/common";

/**
 * Generate a New Controller
 * @param {NodePlopAPI} plop - The plop instance.
 * @author Zach Ayers
 */
export default function (plop: NodePlopAPI) {
  plop.setPartial("randomSalutation", getRandomSalutation());
  plop.setPartial("randomColor", getRandomColor());

  plop.setGenerator("", {
    description: "",
    prompts: [
      {
        type: "input",
        name: "CONTROLLER_NAME",
        message: "What is the name of your controller?",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: path.join(process.cwd(), "src", "controllers"),
        base: "../templates/controller",
        templateFiles: "../templates/controller",
        stripExtensions: ["hbs"],
      },
    ], // TODO add completion message
  });
}
