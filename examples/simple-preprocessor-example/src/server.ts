import viteDevServer from 'vavite/vite-dev-server';
import vaviteHttpServer from 'vavite/http-dev-server';
import { createMeshServer } from 'minimesh';
import { Desktop } from './faces/call-to-action/desktop/desktop.view';
import { OsUsernamePreprocessor } from './preprocessors/os-username.preprocessor';

/**
 * TODO: documentation site link
 */
void createMeshServer({
  serverRoot: import.meta.url,
  httpServer: vaviteHttpServer,
  devServer: viteDevServer,
  manifest: {
    faces: [
      {
        path: 'home',
        views: [{
          exposeAsMesh: true,
          viewName: 'desktop',
          templateFile: 'desktop.view.ejs',
          faces: [
            {contentUrl: '/call-to-action/desktop/', name: 'callToAction'}
          ]
        }],
      },
      {
        path: 'call-to-action',
        views: [
          {
            viewName: 'desktop',
            template: Desktop,
            preprocessors: [OsUsernamePreprocessor],
          },
        ],
      },
    ],
  },
});
