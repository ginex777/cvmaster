import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { createServer } from 'node:http';

const angularApp = new AngularNodeAppEngine();

const requestHandler = createNodeRequestHandler(async (req, res, next) => {
  try {
    const response = await angularApp.handle(req);

    if (response) {
      await writeResponseToNodeResponse(response, res);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});

if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);
  createServer((req, res) => {
    requestHandler(req, res, error => {
      if (error) {
        console.error(error);
      }

      if (!res.headersSent) {
        res.statusCode = error ? 500 : 404;
      }

      res.end(error ? 'Internal Server Error' : 'Not Found');
    });
  }).listen(port);
}

export default requestHandler;
