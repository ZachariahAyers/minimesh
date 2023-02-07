import { MeshClient, MeshEvent, MeshView } from "minimesh";

/**
 * Main Client Entry
 * @description: TODO
 */
export class MainClient extends MeshView {

  protected override onMessage(_message: MeshEvent<unknown>): void {
    console.debug("Recieved message in View 1");

    if (_message.channel === 'hi:channel' && _message.topic === "hi:topic") {
      document.getElementById('target-for-event')?.setAttribute('value', _message.payload)
    }
  }

  protected override onMount(): void {
    super.onMount();
  }

}

MeshClient.registerFaceCodeBehind(MainClient);