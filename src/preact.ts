import { type ComponentType, h, hydrate, type JSX } from "preact";
import type { MeshView } from "./client/view.ts";
import type { PublicData, ViewContext } from "./shared.ts";

/** Hydrates the server-rendered markup of a Preact view, using the same props the server used. */
export function hydrateView<Data extends PublicData>(
  component: ComponentType<ViewContext<Data>>,
  view: MeshView<Data>,
): void {
  hydrate(h(component, view.context), view.root);
}

/**
 * Places a rendered child face inside a Preact template. Hydration keeps the server markup, so
 * the child's own island stays intact.
 */
export function Face({ html }: { html: string | undefined }): JSX.Element {
  return h("div", { dangerouslySetInnerHTML: { __html: html ?? "" } });
}
