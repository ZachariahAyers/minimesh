import { MeshClient, MeshView } from "minimesh";

/**
* Main Client Entry
* @description: TODO
*/
export class MainClient extends MeshView {

  protected override onMount(): void {
    super.onMount();
  }

}

MeshClient.registerFaceCodeBehind(MainClient);