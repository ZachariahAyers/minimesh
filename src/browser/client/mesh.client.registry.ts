import type { MeshView } from "./mesh.view";
import { getWindow } from "../common/get.window";

/**
 * The main face registry store. Stored on the <code>window</code> object.
 * @author Zach Ayers
 */
declare global {
  interface Window {
    MINIMESH_CLIENT_REGISTRY: MeshClientRegistry;
  }
}

/**
 * The main face registry store. Stored on the <code>window</code> object.
 * @author Zach Ayers
 */
export interface MeshClientRegistry {
  faces: {
    [id: string]: MeshView;
  };
}

/**
 * Get the Client Registry singleton from the global window. If one does not exist, create a new singleton.
 * @author Zach Ayers
 * @return {MeshClientRegistry} The singleton Client registry instance (stored on the window object)
 * */
export function getMiniMeshClientRegistry(): MeshClientRegistry {
  // Get the window object
  const globalWindow = getWindow();

  // Pull the EventManager from the window.
  let miniMeshRegistry = globalWindow.MINIMESH_CLIENT_REGISTRY;

  // If no EventManager was found, create one.
  if (!miniMeshRegistry) {
    // Create a new Registry, and initialize an empty face map
    miniMeshRegistry = {
      faces: {},
    };

    // Set the new Registry on the window object.
    globalWindow.MINIMESH_CLIENT_REGISTRY = miniMeshRegistry;
  }

  // Return the found (or new) Registry object.
  return miniMeshRegistry;
}
