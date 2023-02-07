import { MeshClient, MeshEvent, MeshView } from "minimesh";

/**
* Default Client Entry
* @description: TODO
*/
export class DefaultClient extends MeshView {

  protected override onMount(): void {
    super.onMount();
  }

  protected override onMessage(_message: MeshEvent<unknown>): void {}

}

MeshClient.registerFaceCodeBehind(DefaultClient);