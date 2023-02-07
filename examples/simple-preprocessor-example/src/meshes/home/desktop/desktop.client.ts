import { MeshClient, MeshEvent, MeshView } from "minimesh";

/**
* Desktop Client Entry
* @description: TODO
*/
export class DesktopClient extends MeshView {

  protected override onMount(): void {
    super.onMount();
  }

  protected override onMessage(_message: MeshEvent<unknown>): void {}

}

MeshClient.registerFaceCodeBehind(DesktopClient);