import type { ViewContext } from "../../types/face.context";
// Preact
import * as preactMain from "preact";
import * as preactHooks from "preact/hooks";
import * as preactDevTools from "preact/devtools";
import * as preactRuntime from "preact/jsx-runtime";
// @ts-expect-error
import * as preactDebug from "preact/debug";

/**
 * Base Preact adapter for MiniMesh Viewss.
 * @author Zach Ayers
 */
export const preact = {
  ...preactMain,
  /**
   * Preact Hooks
   * @see https://preactjs.com/guide/v10/hooks/
   */
  hooks: preactHooks,
  /**
   * Preact DevTools Adapter
   * @see https://preactjs.github.io/preact-devtools/
   */
  devtools: preactDevTools,
  /**
   * Preact Runtime
   */
  runtime: preactRuntime,
  /**
   * Preact Debug
   * @see https://preactjs.com/guide/v10/debugging/
   */
  debug: preactDebug,
  /**
   * Hydrate the base Preact component with the current context.
   * @param {any} type - The base Preact component to hydrate.
   * @param {ViewContext} context - The current context.
   * @author Zach Ayers
   */
  bootstrap: (type: any, context: ViewContext): void => {
    const root = document.getElementById(context.id) as HTMLElement;
    if (root) {
      preactMain.hydrate(preactMain.h(type, context), root);
    }
  },
  /**
   * Render an imported face's content.
   * @param {string} faceName - The name of the face to render.
   * @param {ViewContext} context - The current context.
   * @return {preactMain.VNode} The rendered face.
   */
  face: (faceName: string, context: ViewContext): preactMain.VNode => {
    return preactMain.h("div", {
      dangerouslySetInnerHTML: {
        __html: context.faces[faceName].toString("utf8"),
      },
    });
  },
};
