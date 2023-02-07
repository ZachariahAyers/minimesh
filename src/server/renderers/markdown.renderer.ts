import type { NodeAsset, FacePublicData } from "../../types/face.simple.types";
import type { FaceRenderer } from "../../types/face.renderer";
import type { FaceContext } from "../../types/face.context";
import type { FaceParams } from "../../types/face.params";
import { Loggable } from "../abstract/loggable";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

/**
 * Markdown Renderer
 * @author Zach Ayers
 */
export class MarkdownRenderer extends Loggable implements FaceRenderer {
  public vendorAssets: Array<NodeAsset> = [];

  /** @inheritDoc */
  public render(
    context: FaceContext<FacePublicData, FaceParams>
  ): string | Promise<string> | Buffer | Promise<Buffer> {
    const markdown: MarkdownIt = MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre class="hljs"><code>' +
              hljs.highlight(str, {
                language: lang,
                ignoreIllegals: true,
              }).value +
              "</code></pre>"
            );
          } catch (__) {}
        }

        return (
          '<pre class="hljs"><code>' +
          markdown.utils.escapeHtml(str) +
          "</code></pre>"
        );
      },
    });

    markdown.linkify.set({ fuzzyEmail: false });
    return markdown.render(context.template as string);
  }
}

export const MARKDOWN = new MarkdownRenderer();
