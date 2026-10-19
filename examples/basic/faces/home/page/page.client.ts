import { defineView, type MeshEvent, MeshView } from "minimesh/client";

/** The page listens for greetings sent by any face. */
class Page extends MeshView {
  override onMessage(event: MeshEvent): void {
    const log = this.root.querySelector(".log");
    if (log !== null) log.textContent = `A face says: ${String(event.payload)}`;
  }
}

defineView("home", "page", Page);
