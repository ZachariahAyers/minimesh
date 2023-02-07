import type { NodePlopAPI } from "plop";
import path from "path";
import {
  AVAILABLE_VIEW_CHOICES,
  getRandomColor,
  getRandomSalutation,
} from "../common/common";

/**
 * TODO
 * @param {NodePlopAPI} plop
 */
export default function (plop: NodePlopAPI) {
  plop.setPartial("randomSalutation", getRandomSalutation());
  plop.setPartial("randomColor", getRandomColor());

  plop.setGenerator("", {
    description: "",
    prompts: [
      {
        type: "input",
        name: "NODE_NAME",
        message: "What is the name of your mesh?",
      },
      {
        type: "input",
        name: "VIEW_NAME",
        message: "What is the name of your mesh's view?",
      },
      {
        type: "list",
        name: "RENDER_TYPE",
        message: "What template language would you like to use for your view?",
        choices: AVAILABLE_VIEW_CHOICES,
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: path.join(process.cwd(), "src", "meshes"),
        base: "../templates/view/{{ lowerCase RENDER_TYPE }}",
        templateFiles: "../templates/view/{{ lowerCase RENDER_TYPE }}",
        stripExtensions: ["hbs"],
      },
    ], // TODO add completion message
  });
}
