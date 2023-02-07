import { createMeshServer } from "./server/app/create-mesh.server";
import * as array from "./utils/array.utils";
import * as boolean from "./utils/boolean.utils";
import * as html from "./utils/html.utils";
import * as http from "./utils/http.utils";
import * as json from "./utils/json.utils";
import * as number from "./utils/number.utils";
import * as object from "./utils/object.utils";
import * as string from "./utils/string.utils";
import * as verify from "./utils/verify.utils";
import * as env from "./utils/env.utils";
import * as onClose from "./server/hooks/on.close";
import * as onError from "./server/hooks/on.error";
import * as onReady from "./server/hooks/on.ready";
import * as onRegister from "./server/hooks/on.register";
import * as onRequest from "./server/hooks/on.request";
import * as onResponse from "./server/hooks/on.response";
import * as onRoute from "./server/hooks/on.route";
import * as onSend from "./server/hooks/on.send";
import * as onTimeout from "./server/hooks/on.timeout";
import * as preHandler from "./server/hooks/pre.handler";
import * as preParsing from "./server/hooks/pre.parsing";
import * as preSerialization from "./server/hooks/pre.serialization";
import * as preValidation from "./server/hooks/pre.validation";
import type { FacePreprocessor as GenericFacePreprocessor } from "./types/face.preprocessor";
import type { FacePublicData } from "./types/face.simple.types";
import type { FaceParams } from "./types/face.params";
import type { Face } from "./types/face";
import type {
  FaceContext,
  PreactViewContext,
  ViewContext,
} from "./types/face.context";

// Utils Interface
export const utils = {
  array,
  boolean,
  html,
  http,
  json,
  number,
  object,
  string,
  verify,
  env,
};

// Hooks Interface
export const hooks = {
  onClose,
  onError,
  onReady,
  onRegister,
  onRequest,
  onResponse,
  onRoute,
  onSend,
  onTimeout,
  preHandler,
  preParsing,
  preSerialization,
  preValidation,
};

// Public Browser Interface
export { MeshEvent } from "./browser/eventing/mesh.event";
export { EventBus, EventListener, events } from "./browser/eventing/event.bus";
export { preact } from "./browser/client/mesh.preact";
export { http } from "./browser/client/mesh.http";
export { EventAddress } from "./browser/eventing/event.address";
export { MeshView } from "./browser/client/mesh.view";
export { MeshClient } from "./browser/client/mesh.client";
export { ViewContext, PreactViewContext };

// Public Server Interface
export { MeshController } from "./server/abstract/mesh.controller";
export { createMeshServer };
export type FacePreprocessor = GenericFacePreprocessor<
  FacePublicData,
  FaceParams
>;
export type ServerContext = FaceContext<FacePublicData, FaceParams>;

// Types Interface
export { MeshServerManifest } from "./types/mesh.server.manifest";
type Mesh = Face;
export { Mesh, Face };
export { MeshInstance, ApiRequest, ApiReply } from "./types/mesh.simple.types";
