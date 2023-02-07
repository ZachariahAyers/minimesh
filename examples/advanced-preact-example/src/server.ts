import { createMeshServer, Face } from "minimesh";
import { TestController } from "./controllers/test.controller";
import { UserController } from "./controllers/user.controller";
import { TestView4 } from "./faces/test-node/test-view-4/test.view";
import { PreactApp } from "./faces/preact-tests/desktop/preact.app";
import viteDevServer from 'vavite/vite-dev-server';
import vaviteHttpServer from 'vavite/http-dev-server';

console.log(viteDevServer);

const testFace: Face = {
  path: "test-node",
  shared: {},
  views: [
    {
      viewName: "test-view",
      templateFile: "test.view.ejs",
      exposeAsMesh: true,
      faces: [
        { name: "testChild", contentUrl: "/test-node/test-view-2/" },
        { name: "testChild2", contentUrl: "/test-node/test-view-4/" }
      ],
      preprocessors: [
        {
          preprocessor: (context: {
            setPublicData: (arg0: {
              test: string;
              abc: string;
              x: string;
              bill: string;
            }) => void;
          }) => {
            context.setPublicData({
              test: "test",
              abc: "123123123",
              x: "y",
              bill: "hank,dale,boom,alas"
            });
          },
          priority: 1
        }
      ]
    },
    {
      viewName: "test-view-2",
      templateFile: "test.ejs",
      faces: [
        { name: "testChild3", contentUrl: "/test-node/test-view-3/" }
      ]
    },
    {
      viewName: "test-view-3",
      templateFile: "test.view.html"
    },
    {
      viewName: "test-view-4",
      template: TestView4,
      faces: [
        { name: "testChild3", contentUrl: "/test-node/test-view-3/" },
        { name: "preactApp", contentUrl: "/preact-tests/desktop/"}
      ]
    }
  ]
};

const preactFace: Face = {
  path: "preact-tests",
  views: [{ viewName: "desktop", template: PreactApp,  faces: [
      { name: "testChild3", contentUrl: "/test-node/test-view-3/" }
    ]}],
};

void createMeshServer({
  httpServer: vaviteHttpServer,
  devServer: viteDevServer,
  serverRoot: import.meta.url,
  // httpServer: httpDevServer,
  // devServer: viteDevServer,
  manifest: {
    faces: [testFace, preactFace],
    shared: {},
    // TODO: test assets
    assetDirectoryRoots: [{ path: "./assets" }],
    controllers: [TestController, UserController],
  }
});
