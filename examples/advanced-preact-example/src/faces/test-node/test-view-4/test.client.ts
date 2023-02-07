import { MeshClient, MeshView, preact } from "minimesh";
import { TestView4 } from './test.view';

/**
 * TODO
 */
export class MyFace4 extends MeshView {
  protected override onMount(): void {
    super.onMount();
    preact.bootstrap(TestView4, this.context);
  }
}

MeshClient.registerFaceCodeBehind(MyFace4);