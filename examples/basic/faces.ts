import type { Face } from "minimesh";
import { Card } from "./faces/greeting/card/card.view.ts";

/** The page composes two faces: a Preact greeting card and a Markdown note. */
export const faces: Face[] = [
  {
    name: "home",
    views: [
      {
        name: "page",
        mesh: true,
        title: "MiniMesh example",
        templateFile: "page.view.ejs",
        faces: [
          { name: "greeting", url: "/greeting/card/" },
          { name: "notes", url: "/about/notes/" },
        ],
      },
    ],
  },
  {
    name: "greeting",
    views: [
      {
        name: "card",
        template: Card,
        assets: ["card.client.ts", "card.styles.scss"],
        preprocessors: [
          ({ request, data }) => {
            const { name } = request.query as { name?: unknown };
            data.name = typeof name === "string" && name.length > 0 ? name : "there";
          },
        ],
      },
    ],
  },
  {
    name: "about",
    views: [{ name: "notes", templateFile: "notes.md" }],
  },
];
