import type { NodePlopAPI } from "plop";
import path from "path";
import { getRandomColor, getRandomSalutation } from "../common/common";

/**
 * Generate a new Server.
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
        name: "MODEL_NAME",
        message: "What is the name of your model?",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: path.join(process.cwd(), "src", "models"),
        base: "../templates/model",
        templateFiles: "../templates/model",
        stripExtensions: ["hbs"],
      },
    ], // TODO add completion message
  });
}
