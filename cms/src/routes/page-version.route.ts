import { NextFunction, Request, Response, Router } from 'express';
import { withDependencies as withContentVersionDependencies } from '../controllers/content-version-controller';
import { logger } from '../utils/logger.utils';
import { PageVersion } from '../controllers/page.controller';
import { MAX_VERSIONS, PAGE_VERSION_CONTAINER } from '../constants';

const pageVersionRouter = Router();
const PageVersionController = withContentVersionDependencies<PageVersion>({
  CONTENT_VERSION_CONTAINER: PAGE_VERSION_CONTAINER,
  MAX_VERSIONS: MAX_VERSIONS,
});

// Get all versions for a page
pageVersionRouter.get(
  '/:businessUnitKey/pages/:key/versions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey, key } = req.params;
      const versions = await PageVersionController.getContentVersions(
        businessUnitKey,
        key
      );

      res.json(versions);
    } catch (error) {
      logger.error('Failed to get versions:', error);
      next(error);
    }
  }
);

export default pageVersionRouter;
