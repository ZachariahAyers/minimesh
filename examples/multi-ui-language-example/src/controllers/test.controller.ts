import { ApiReply, ApiRequest, MeshController, MeshInstance } from "minimesh";

export class TestController extends MeshController {
  public register(app: MeshInstance): void {
    app.get("/test", async (_req: ApiRequest, rep: ApiReply) =>
      rep.send("test API is alive!")
    );
  }
}
