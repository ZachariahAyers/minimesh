import type { NodePlopAPI } from "plop";
import path from "path";
import { getRandomColor, getRandomSalutation } from "../common/common";

/**
 * Generate a new Preprocessor.
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
        name: "PREPROCESSOR_NAME",
        message: "What is the name of your preprocessor?",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: path.join(process.cwd(), "src", "preprocessors"),
        base: "../templates/preprocessor",
        templateFiles: "../templates/preprocessor",
        stripExtensions: ["hbs"],
      },
    ], // TODO add completion message
  });
}
