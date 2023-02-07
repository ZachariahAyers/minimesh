import { MeshClient, MeshView, preact } from "minimesh";
import { Welcome } from './welcome.view';

/**
* Welcome Client Entry
* @description: TODO
*/
export class WelcomeClient extends MeshView {
  protected override onMount(): void {
    super.onMount();
    preact.bootstrap(Welcome, this.context);
  }
}

MeshClient.registerFaceCodeBehind(WelcomeClient);