import { MeshClient, MeshEvent, MeshView } from "minimesh";


/**
 * TODO
 */
export class MyFace1 extends MeshView {

  protected override onMessage(message: MeshEvent<unknown>): void {
    console.debug("Recieved message in View 1");
    console.debug(this.constructor.name, message);
  }
}

MeshClient.registerFaceCodeBehind(MyFace1);


