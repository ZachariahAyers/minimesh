import type { MeshViewConstructor } from "./mesh.view";
import { CONSTANTS } from "../../constants/mesh.constants";
import {
  getMiniMeshClientRegistry,
  MeshClientRegistry,
} from "./mesh.client.registry";

/**
 * Main MiniMesh Client Entrypoint.
 * @description This entrypoint is bundled and provided to the browser by the top-most mesh.
 * @author Zach Ayers
 * @author Zach Ayers
 */
export class MeshClient {
  /**
   * Has the welcome banner been printed?
   * @type {boolean}
   * @private
   */
  private static _loaded = false;

  /**
   * Get the MeshClientRegistry singleton from the global window. If one does not exist, create a new singleton.
   * @return {MeshClientRegistry}
   */
  public static getMeshClientRegistry(): MeshClientRegistry {
    return getMiniMeshClientRegistry();
  }

  /**
   * Register a MeshView with the global registry.
   * @param {MeshViewConstructor} constructor - The MeshView constructor to register.
   */
  public static registerFaceCodeBehind(constructor: MeshViewConstructor) {
    // TODO: do not show this in production - NOTE: Envs are sent to the browser using `import.meta.env.ENV_NAME`
    if (!MeshClient._loaded) {
      MeshClient.printWelcomeBanner();
      MeshClient._loaded = true;
    }

    // Get the current executing script -
    // the script will hava a data attribute with a corresponding face id
    const currentExecutor = document.currentScript;

    // Get the face pointer from the script
    const pointerId = currentExecutor?.getAttribute(
      CONSTANTS.faceDataIdentifier
    );

    // If no pointer was found, throw an error and return
    if (!pointerId) {
      console.error("Error: Unable to locate face data pointer!");
      return;
    }

    this.getMeshClientRegistry().faces[pointerId] = new constructor(pointerId);
  }

  /**
   * Print the welcome banner to the console.
   * @private
   */
  private static printWelcomeBanner() {
    console.log(CONSTANTS.welcomeBanner);

    console.info(
      "/ ~ %cWelcome to MiniMesh!%c ~",
      "color:default",
      "color:default"
    );
    console.info(
      "\\ ~ Below you will find contextual information about registered faces ~"
    );
    console.info(CONSTANTS.welcomeBannerConsoleSeparator);
  }
}
