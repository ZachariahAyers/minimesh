import type { CssAsset } from "../../types/css.asset";
import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { RawTemplate } from "../../types/face.simple.types";
import type { FaceView } from "../../types/face.view";
import type { JsAsset } from "../../types/js.asset.js";
import fs from "fs";
import path from "path";
import { MINIMESH } from "../config/mesh.config";
import { assertFileExists, checkFileExists } from "../../utils/file.utils";
import { parse } from "node-html-parser";
import { toBoolean } from "../../utils/boolean.utils";
import { convertExtsToDistPointer } from "../../utils/html.utils";
import { preRenderTemplate } from "../renderers/rendering/pre.render.template";

/**
 * Build all face views on the server side at startup and prep any cacheables.
 * @param {MeshServerOptions} userOpts - The user options to use.
 * @return {any} faceViews - The face views to use.
 * @author Zach Ayers
 */
export function buildFaceViews(userOpts: MeshServerOptions) {
  return userOpts.manifest.faces?.map((face) => {
    // Get Root Path and Assert it exists
    const faceRootPath = "./faces";
    let rootPath = face.root ?? faceRootPath;
    let baseDirPath = path.join(MINIMESH.root, rootPath);
    assertFileExists(baseDirPath, rootPath);

    // Get face View Directory and Assert it exists
    let faceViewDir = path.join(baseDirPath, face.path);

    // If file doesn't exist here, check the meshes folder
    if (!checkFileExists(faceViewDir)) {
      rootPath = "./meshes";
      baseDirPath = path.join(MINIMESH.root, rootPath);
      if (checkFileExists(baseDirPath)) {
        faceViewDir = path.join(baseDirPath, face.path);
      }
    }

    assertFileExists(faceViewDir, rootPath, face.path);

    return {
      ...face,
      views: face.views.map((view) => {
        const viewDir = path.join(faceViewDir, view.viewName);
        assertFileExists(viewDir, rootPath, face.path, view.viewName);

        // Check type of view template
        const useFileLoader = view.templateFile !== undefined;
        const viewTemplateFilePath = path.join(
          viewDir,
          view.templateFile ?? ""
        );
        if (useFileLoader) {
          assertFileExists(
            viewTemplateFilePath,
            rootPath,
            face.path,
            view.viewName,
            view.templateFile
          );
        }

        // Sanitize scss and ts links in functional/class templates
        const getTemplate = useFileLoader
          ? () =>
              convertExtsToDistPointer(
                fs.readFileSync(viewTemplateFilePath).toString()
              )
          : () => view.template as RawTemplate;

        const renderableContext = <FaceView>{
          ...view,
          template: getTemplate(),
          getTemplate,
          root: face.path,
          manifestUrl: `/${face.path}/${view.viewName}/manifest/`,
          contentUrl: `/${face.path}/${view.viewName}/`,
          dataUrl: `/${face.path}/${view.viewName}/data/`,
        };

        view.getTemplate = getTemplate;

        // Check Renderability and gather assets
        let rawTemplate = "";
        try {
          rawTemplate = preRenderTemplate(userOpts, face, view);
        } catch (e) {
          throw new Error(
            `Template for view: '${view.viewName}' failed to pre-render...: \n${e}`
          );
        }

        // Parse HTML on Server Startup - pull out scripts and styles
        const parsedHtml = parse(rawTemplate.toString());
        const scripts = parsedHtml.querySelectorAll("script");
        const styles = parsedHtml.querySelectorAll("link");

        renderableContext.assets = {
          js: scripts.map((el) => {
            const attrs = el.attrs;
            return {
              src: attrs["src"]
                ? `/${face.path}/${view.viewName}/${attrs["src"]}`.replace(
                    ".ts",
                    ".js"
                  )
                : "",
              ...(attrs["async"] !== undefined && {
                async:
                  attrs["async"].length === 0
                    ? true
                    : toBoolean(attrs["async"]),
              }),
              ...(attrs["crossorigin"] !== undefined && {
                crossorigin: attrs["crossorigin"] as JsAsset["crossorigin"],
              }),
              ...(attrs["defer"] !== undefined && {
                defer:
                  attrs["defer"].length === 0
                    ? true
                    : toBoolean(attrs["defer"]),
              }),
              ...(attrs["integrity"] !== undefined && {
                integrity: attrs["integrity"],
              }),
              ...(attrs["nomodule"] !== undefined && {
                nomodule:
                  attrs["nomodule"].length === 0
                    ? true
                    : toBoolean(attrs["nomodule"]),
              }),
              ...(attrs["referrerpolicy"] !== undefined && {
                referrerpolicy: attrs[
                  "referrerpolicy"
                ] as JsAsset["referrerpolicy"],
              }),
              ...(attrs["type"] !== undefined && { type: attrs["type"] }),
            };
          }),
          css: styles.map((el) => {
            const attrs = el.attrs;
            return {
              href: attrs["href"]
                ? `/${face.path}/${view.viewName}/${attrs["href"]}`
                : "",
              rel: (attrs["rel"] as CssAsset["rel"]) ?? "stylesheet",
              ...(attrs["crossorigin"] !== undefined && {
                crossorigin: attrs["crossorigin"] as CssAsset["crossorigin"],
              }),
              ...(attrs["disabled"] !== undefined && {
                disabled:
                  attrs["disabled"].length === 0
                    ? true
                    : toBoolean(attrs["disabled"]),
              }),
              ...(attrs["hreflang"] !== undefined && {
                hreflang: attrs["hreflang"],
              }),
              ...(attrs["media"] !== undefined && {
                media: attrs["media"] as CssAsset["media"],
              }),
              ...(attrs["type"] !== undefined && { type: attrs["type"] }),
            };
          }),
        };

        return renderableContext;
      }),
    };
  });
}
