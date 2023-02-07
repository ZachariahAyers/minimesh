import { createMeshServer, Face, Mesh } from "minimesh";
import viteDevServer from 'vavite/vite-dev-server';
import vaviteHttpServer from 'vavite/http-dev-server';
import { Welcome } from "./meshes/home/welcome/welcome.view";
import { TestPreprocesser } from "./preprocessors/test.preprocessor";
import { TestController } from "./controllers/test.controller";

const HomeMesh: Mesh = {
  path: 'home',
  views:[ {
    exposeAsMesh: true,
    viewName: 'welcome',
    template: Welcome,
    faces: [
      {name: 'ejs', contentUrl: '/greeting/main/'},
      {name: 'html', contentUrl: '/html/main/'},
      {name: 'markdown', contentUrl: '/md-test/default/'},
    ]
  }]
}

const GreetingFace: Face = {
  path: 'greeting',
  views: [
    {
      viewName: 'main',
      templateFile: 'main.view.ejs'
    }
  ]
}

const MDTest: Face = {
  path: 'md-test',
  views: [{
    viewName: 'default',
    templateFile: 'default.view.md'
  }]
}

const HtmlFace: Face = {
  path: 'html',
  views: [{
    viewName: 'main',
    templateFile: 'main.view.html'
  }]
}

/**
 * TODO: documentation site link
 */
void createMeshServer({
  serverRoot: import.meta.url,
  httpServer: vaviteHttpServer,
  devServer: viteDevServer,
  manifest: {
    shared: {
      preprocessors: [TestPreprocesser]
    },
    controllers: [TestController],
    faces: [
      HomeMesh,
      GreetingFace,
      HtmlFace,
      MDTest,
    ],
  },
});
