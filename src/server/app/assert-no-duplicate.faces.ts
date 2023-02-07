import type { MeshServerOptions } from "../../types/mesh.server.options";

/**
 * Assert there are no faces registered twice.
 * @param {MeshServerOptions} userOpts - The user options to use.
 * @author Zach Ayers
 */
export function assertNoDuplicateFaces(userOpts: MeshServerOptions): void {
  // Ensure no faces are added twice to the manifest
  userOpts.manifest.faces?.forEach((face) => {
    let faceCount = 0;
    // Check Node Path only exists once
    userOpts.manifest.faces?.forEach((comparator) => {
      if (face.path === comparator.path) {
        faceCount++;
        if (faceCount > 1) {
          throw new Error(
            `[ ${face.path} ] declared more than once in face manifest!`
          );
        }
      }

      // Check Node Views only exist once
      face.views.forEach((view) => {
        let viewCount = 0;

        comparator.views.forEach((comparatorView) => {
          if (view.viewName === comparatorView.viewName) {
            viewCount++;
            if (viewCount > 1) {
              throw new Error(
                `[ ${face.path} -> ${view.viewName} ] declared more than once in face manifest!`
              );
            }
          }
        });
      });
    });
  });
}
