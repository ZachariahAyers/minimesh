import { ApiReply, ApiRequest, MeshController, MeshInstance } from "minimesh";

export class UserController extends MeshController {
  public register(app: MeshInstance): void {
    app.get("/users", (_req: ApiRequest, rep: ApiReply) =>
      rep.send("user")
    );
  }
}
