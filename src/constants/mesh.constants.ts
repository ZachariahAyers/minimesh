export const CONSTANTS = {
  welcomeBanner: `
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░███╗░░░███╗██╗███╗░░██╗██╗███╗░░░███╗███████╗░██████╗██╗░░██╗░░░░░░░
░░░░░░████╗░████║██║████╗░██║██║████╗░████║██╔════╝██╔════╝██║░░██║░░░░░░░
░░░░░░██╔████╔██║██║██╔██╗██║██║██╔████╔██║█████╗░░╚█████╗░███████║░░░░░░░
░░░░░░██║╚██╔╝██║██║██║╚████║██║██║╚██╔╝██║██╔══╝░░░╚═══██╗██╔══██║░░░░░░░
░░░░░░██║░╚═╝░██║██║██║░╚███║██║██║░╚═╝░██║███████╗██████╔╝██║░░██║░░░░░░░
░░░░░░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝╚═╝╚═╝░░░░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░  ░░░  ░░░  ░░░  Distributed MicroFrontends Made Easy ░░░  ░░░  ░░░  ░░░
  ░░   ░░   ░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ░░   ░░   ░░   `,
  welcomeBannerConsoleSeparator: `░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
  welcomeBannerSlim: `MiniMesh - Distributed MicroFrontends Made Easy`,
  branding: {
    gold: "#bdba5a",
    blue: "#0095c5",
    green: "#01abab",
    yellow: "#ceaa2e",
    purple: "#8858e0",
    orange: "#d0663d",
    puse: "#a4b95a",
    cyan: "#3a737e",
  },
  env: <{ [key: string]: { key: string; value?: unknown } }>{
    prefix: { key: "MINIMESH_" },
    host: { key: "MINIMESH_HOST", value: "0.0.0.0" },
    port: { key: "MINIMESH_PORT", value: 3000 },
    environment: { key: "MINIMESH_ENVIRONMENT", value: "local" },
    enableRequestLogging: { key: "MINIMESH_ENABLE_REQUEST_LOGS", value: false },
    logLevel: { key: "MINIMESH_LOG_LEVEL", value: "info" },
    basicAuthUser: { key: "MINIMESH_BASIC_AUTH_USER", value: "test" },
    basicAuthPassword: { key: "MINIMESH_BASIC_AUTH_PASSWORD", value: "test" },
  },
  buildOutputFolder: "dist",
  dataIdPrefix: "__MINIMESH_DATA__",
  defaultHTMLTitle: "MiniMesh",
  defaultLoggerClassName: "minimesh:core",
  eventingGlobalChannel: "minimesh:global:events",
  eventingGlobalFaceChannel: "minimesh:gobal:faces",
  eventingGlobalMeshChannel: "minimesh:gobal:mesh",
  eventingGlobalTopic: "minimesh:gobal:msg",
  faceClassIdentifier: "minimesh-face",
  faceDataIdentifier: "data-face-target",
  faceIdHeader: "x-minimesh-face-id",
  faceIdIdentifier: "id",
  faceNameIdentifier: "data-face-name",
  faceNestIdentifier: "data-face-nest-level",
  faceUrlIdentifier: "data-face-url",
  faceViewIdentifier: "data-face-view",
  htmlWrapperTag: "section",
  meshIdHeader: "x-minimesh-mesh-id",
  nestLevelHeader: "x-minimesh-nest-level",
};
