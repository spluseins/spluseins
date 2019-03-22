import * as express from 'express';
import splusController from './controllers/splus';
import mensaController from './controllers/mensa';
import newsController from './controllers/news';
import icsController from './controllers/ics';

class App {
  public app: express.Application;

  constructor(private basePath: string = '/api') {
    this.app = express();
    this.routes();
  }

  private routes(): void {
    this.app.use(this.basePath + '/splus', splusController);
    this.app.use(this.basePath + '/mensa', mensaController);
    this.app.use(this.basePath + '/news', newsController);
    this.app.use(this.basePath + '/ics', icsController);
  }
}

export default App;
