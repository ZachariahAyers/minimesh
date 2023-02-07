import type { FaceView } from "./face.view";
import type { RouteShorthandOptions } from "fastify";

/**
 * A Face is the building block of Mni.
 * @description Each MiniMesh server is composed of 1 to Many Faces.
 * Each Face may render child Faces from external servers.
 * The general lifecycle of a Face is as follows:
 *
 * 1.
 * An HTTP request comes in to the MiniMesh server requesting the content for Face 'A
 *
 * 2.
 * The MiniMesh server fetches the template for the Face 'A',
 * runs it through any defined preprocessors,
 * then runs it through the defined Face renderer.
 *
 * 3.
 * The MiniMesh server then returns the manipulated template to the requesting Face -
 *    along with a JSON script of any Public data on the FaceContext object.
 *
 * 4.
 * While waiting on the Face content, the requesting Face will use a cached 'manifest.json'
 *    for this Face to reach out and gather any required Assets.
 *
 * 5.
 * The requesting Face will then compile the retrieved template,
 *   and any required Assets, into a final template.
 * @category (Face)
 * @author Zach Ayers
 * @public
 */
export interface Face {
  /**
   * The name of this node
   */
  readonly path: string;
  /**
   * The base directory to search for this node set in.
   */
  readonly root?: string;
  /** When MINIMESH is NOT 'production', and this Face is NOT being requested from another Face, apply these developmentOptions tools */
  readonly developmentOptions?: FaceView["developmentOptions"];
  /** Collection of common Face options that will be passed to ALL Face views */
  readonly shared?: {
    /** Array of Face Preprocessors to run on the FaceTemplate of each view, sorted by Priority */
    readonly preprocessors?: FaceView["preprocessors"];
    /** Array of helper functions to pass to the FaceContext for all views of this Face */
    readonly helpers?: FaceView["helpers"];
    /** Any Nodes that all views of this Face require to render appropriately */
    readonly faces?: FaceView["faces"];
    /** Any request parameters to be validated when making FaceTemplate content requests */
    readonly paramsSchema?: FaceView["paramsSchema"];
    /** Any Route options to use for every view of this Face. */
    readonly routeOpts?: RouteShorthandOptions;
  };
  /** Array of views for this Face */
  views: Array<FaceView>; // All Views of this Face
}

/**
 * Array of Renderable Nodes
 */
export type FaceManifest = Array<Face>;
