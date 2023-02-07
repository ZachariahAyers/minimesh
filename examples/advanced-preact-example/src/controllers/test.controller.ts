import { ApiReply, ApiRequest, MeshController, MeshInstance } from "minimesh";

export class TestController extends MeshController {
  public register(app: MeshInstance): void {
    app.get("/hello", async (_req: ApiRequest, rep: ApiReply) =>
      rep.send("Hello")
    );
  }
}