import type { FaceContext } from "../../../types/face.context";
import type { AnyObject } from "../../../types/object.any";
import type { FaceParams } from "../../../types/face.params";
import type { FaceRenderer } from "../../../types/face.renderer";
import path from "path";
import { EJS } from "../ejs.renderer";
import { STRING } from "../string.renderer";
import { PREACT } from "../preact.renderer";
import { MARKDOWN } from "../markdown.renderer";

/**
 * Get the required renderer based on the 'template' or 'templatePath' variables.
 * Here we can make assumptions about the file-type and set the renderer accordingly.
 * @param {Partial<Pick<FaceContext<AnyObject, AnyObject, FaceParams>, "template" | "templateFile" | "renderer">>} context
 * @return {FaceRenderer}
 * @author Zach Ayers
 */
export function getRenderer(
  context: Partial<
    Pick<
      FaceContext<AnyObject, FaceParams>,
      "template" | "templateFile" | "renderer"
    >
  >
): FaceRenderer {
  // Check if we are using a file loader
  // This section is where we can import templates from file paths.
  // i.e. (html files, ejs files, etc.)
  if (context.templateFile !== undefined) {
    const ext = path.extname(context.templateFile);
    switch (ext) {
      case ".ejs":
        context.renderer = "EJS";
        return EJS;
      case ".html":
        context.renderer = "HTML";
        return STRING;
      case ".md":
        context.renderer = "MARKDOWN";
        return MARKDOWN;
    }

    throw new Error(`No renderer found for file type: '${ext}'`);
  } else if (context.template !== undefined) {
    // Else, use the raw template loader
    // This section is where we can import templates directly via code.
    // i.e. (template strings, jsx elements, etc.)
    switch (typeof context.template) {
      case "string":
        context.renderer = "STRING";
        return STRING;
      case "function":
        context.renderer = "PREACT";
        return PREACT;
    }

    throw new Error(
      `No renderer found for variable type: '${typeof context.template}'`
    );
  }

  throw new Error(
    `No render-able template or templateFile was provided to the rendering engine.`
  );
}
