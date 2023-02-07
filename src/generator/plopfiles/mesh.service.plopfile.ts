import type { NodePlopAPI } from "plop";
import path from "path";
import { getRandomColor, getRandomSalutation } from "../common/common";

/**
 * Generate a new Service.
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
        name: "SERVICE_NAME",
        message: "What is the name of your service?",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: path.join(process.cwd(), "src", "services"),
        base: "../templates/service",
        templateFiles: "../templates/service",
        stripExtensions: ["hbs"],
      },
    ], // TODO add completion message
  });
}
