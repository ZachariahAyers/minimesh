import type { MeshInstance } from "../../types/mesh.simple.types";
import { Loggable } from "./loggable";

/**
 * Abstract definition of a MiniMesh Controller
 * @todo Work on this interface, make controllers easier to use with annotations and decorators
 * @author Zach Ayers
 */
export abstract class MeshController extends Loggable {
  /**
   * Register a controller with the server.
   * @param {MeshInstance} app - The server instance to register the controller with.
   * @param {Face} node - The node to register the controller with.
   * @param {NodeView} view - The view to register the controller with.
   * @returns {Promise<void>}
   */
  abstract register(app: MeshInstance): void;
}
