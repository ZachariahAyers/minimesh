import { createMeshServer } from "minimesh";
import { faces } from "./faces.ts";

const app = await createMeshServer({
  root: new URL("./faces/", import.meta.url),
  assetsDir: new URL("./dist/", import.meta.url),
  faces,
  fastify: { logger: true },
});

await app.listen({ host: "127.0.0.1", port: Number(process.env.PORT ?? 3000) });
