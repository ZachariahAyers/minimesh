import { MeshClient, MeshView } from "minimesh";

/**
 * TODO
 */
export class MyFace2 extends MeshView {
  protected override onMount(): void {
    super.onMount();
    this.toAll("Hey there everyone!");
    this.toFaces("Hey there faces!");
    this.toMesh("Hey there mesh!");
  }
}

MeshClient.registerFaceCodeBehind(MyFace2);
