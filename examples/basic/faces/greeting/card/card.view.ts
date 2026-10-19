import type { ViewContext } from "minimesh";
import { h, type JSX } from "preact";

type Props = ViewContext<{ name?: string }>;

/** Rendered on the server, then hydrated in the browser with the same props. */
export function Card({ data }: Props): JSX.Element {
  return h("article", { class: "card" }, [
    h("h2", null, `Hello, ${data.name ?? "there"}`),
    h("button", { type: "button", "data-wave": "" }, "Wave to the page"),
  ]);
}
