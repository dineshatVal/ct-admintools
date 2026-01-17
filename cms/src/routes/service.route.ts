import { Router } from 'express';
import contentItemStateRouter from './content-item-state.route';
import contentItemVersionRouter from './content-item-version.route';
import contentItemRouter from './content-item.route';
import contentTypeRouter from './content-type.route';
import datasourceRouter from './datasource.route';
import fileRouter from './file.route';
import healthRouter from './health.route';
import pageComponentRouter from './page-component.route';
import pageRowRouter from './page-row.route';
import pageStateRouter from './page-state.route';
import pageVersionRouter from './page-version.route';
import pagesRouter from './pages.route';
import proxyRouter from './proxy.route';
import pageContentItemStateRouter from './page-content-item-state.route';

const serviceRouter = Router();

serviceRouter.use('/', contentTypeRouter);
serviceRouter.use('/', contentItemRouter);
serviceRouter.use('/', fileRouter);
serviceRouter.use('/', datasourceRouter);
serviceRouter.use('/', proxyRouter);
serviceRouter.use('/', contentItemVersionRouter);
serviceRouter.use('/', contentItemStateRouter);
serviceRouter.use('/', pageContentItemStateRouter);
serviceRouter.use('/', pageComponentRouter);
serviceRouter.use('/', pageVersionRouter);
serviceRouter.use('/', pageStateRouter);
serviceRouter.use('/', pageRowRouter);
serviceRouter.use('/', pagesRouter);
serviceRouter.use('/', healthRouter);

export default serviceRouter;
