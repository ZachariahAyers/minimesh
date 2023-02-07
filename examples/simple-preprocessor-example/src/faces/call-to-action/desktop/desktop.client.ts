import { MeshClient, MeshView, preact } from "minimesh";
import { Desktop } from './desktop.view';

/**
* Desktop Client Entry
* @description: TODO
*/
export class DesktopClient extends MeshView {
  protected override onMount(): void {
    super.onMount();
    preact.bootstrap(Desktop, this.context);
  }
}

MeshClient.registerFaceCodeBehind(DesktopClient);