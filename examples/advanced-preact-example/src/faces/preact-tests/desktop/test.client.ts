import { MeshClient, MeshView, preact } from "minimesh";
import { PreactApp } from './preact.app';

/**
 * TODO
 */
export class PreactAppView extends MeshView {
  protected override onMount(): void {
    super.onMount();
    preact.bootstrap(PreactApp, this.context);
  }
}

MeshClient.registerFaceCodeBehind(PreactAppView);