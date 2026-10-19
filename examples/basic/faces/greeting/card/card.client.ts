import { defineView, MeshView } from "minimesh/client";
import { hydrateView } from "minimesh/preact";
import { Card } from "./card.view.ts";

class CardView extends MeshView<{ name?: string }> {
  override onMount(): void {
    hydrateView(Card, this);
    this.root.querySelector("[data-wave]")?.addEventListener("click", () => {
      this.toMesh(`hello from ${this.context.data.name ?? "a visitor"}`);
    });
  }
}

defineView("greeting", "card", CardView);
