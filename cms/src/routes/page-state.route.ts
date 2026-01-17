import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { logger } from '../utils/logger.utils';
import {
  withDependencies,
  StateControllerDependencies,
} from '../controllers/content-state-controller';
import CustomError from '../errors/custom.error';
import { CustomObjectController } from '../controllers/custom-object.controller';
import { CONTENT_PAGE_CONTAINER, PAGE_STATE_CONTAINER } from '../constants';
import { PageState } from '../controllers/page.controller';

const pageStateRouter = Router();
const dependencies: StateControllerDependencies = {
  CONTENT_CONTAINER: CONTENT_PAGE_CONTAINER,
  CONTENT_STATE_CONTAINER: PAGE_STATE_CONTAINER,
};
const PageStateController = withDependencies<PageState>(dependencies);

// Get states for a content item
pageStateRouter.get(
  '/:businessUnitKey/pages/:key/states',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey, key } = req.params;
      const stateKey = `${businessUnitKey}_${key}`;

      try {
        const object = await PageStateController.getState(stateKey);
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
pageStateRouter.put('/:businessUnitKey/pages/:key/states/published', (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clearDraft } = req.query;
    const { businessUnitKey, key } = req.params;
    const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
    const page = await pageController.getCustomObject(key);
    const item = page.value;

    console.log('item >> ', item);

    const state = await PageStateController.createPublishedState(
      businessUnitKey,
      key,
      item,
      clearDraft === 'true'
    );

    console.log('state >> ', state);

    res.json(state);
  } catch (error) {
    logger.error('Failed to publish state:', error);
    next(error);
  }
}) as RequestHandler);

// Delete draft state (revert to published)
pageStateRouter.delete('/:businessUnitKey/pages/:key/states/draft', (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessUnitKey, key } = req.params;

    const state = await PageStateController.deleteDraftState(
      businessUnitKey,
      key
    );
    res.json(state);
  } catch (error) {
    logger.error('Failed to delete draft state:', error);
    next(error);
  }
}) as RequestHandler);

export default pageStateRouter;
