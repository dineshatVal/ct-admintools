import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { logger } from '../utils/logger.utils';
import { withDependencies as withContentStateDependencies } from '../controllers/content-state-controller';

import CustomError from '../errors/custom.error';

import { ContentItemState } from '../controllers/content-item.controller';
import { PAGE_CONTENT_ITEM_STATE_CONTAINER, PAGE_CONTENT_ITEMS_CONTAINER } from '../constants';

const pageContentItemStateRouter = Router();
const PageContentItemStateController =
  withContentStateDependencies<ContentItemState>({
    CONTENT_CONTAINER: PAGE_CONTENT_ITEMS_CONTAINER,
    CONTENT_STATE_CONTAINER: PAGE_CONTENT_ITEM_STATE_CONTAINER,
  });

// Get states for a content item
pageContentItemStateRouter.get(
  '/:businessUnitKey/page-items/:key/states',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey, key } = req.params;
      const stateKey = `${businessUnitKey}_${key}`;

      try {
        const object = await PageContentItemStateController.getState(stateKey);
        res.json(object);
      } catch (error) {
        // If not found, return empty states object
        if ((error as any).statusCode === 404) {
          res.json({
            key,
            businessUnitKey,
            states: {},
          });
        } else {
          throw new CustomError(500, 'Failed to get states');
        }
      }
    } catch (error) {
      logger.error('Failed to get states:', error);
      next(error);
    }
  }
);

// Publish state (move draft to published)
pageContentItemStateRouter.put(
  '/:businessUnitKey/page-items/:key/states/published',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clearDraft } = req.query;
      const { businessUnitKey, key } = req.params;
      const { value } = req.body;

      const state = await PageContentItemStateController.createPublishedState(
        businessUnitKey,
        key,
        value,
        clearDraft === 'true'
      );
      res.json(state);
    } catch (error) {
      logger.error('Failed to publish state:', error);
      next(error);
    }
  }) as RequestHandler
);

// Delete draft state (revert to published)
pageContentItemStateRouter.delete(
  '/:businessUnitKey/page-items/:key/states/draft',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey, key } = req.params;

      const state = await PageContentItemStateController.deleteDraftState(
        businessUnitKey,
        key
      );
      res.json(state);
    } catch (error) {
      logger.error('Failed to delete draft state:', error);
      next(error);
    }
  }) as RequestHandler
);

export default pageContentItemStateRouter;
