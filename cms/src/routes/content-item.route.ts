import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import * as ContentItemController from '../controllers/content-item.controller';
import { logger } from '../utils/logger.utils';
import CustomError from '../errors/custom.error';

const contentItemRouter = Router();

contentItemRouter.get(
  '/:businessUnitKey/content-items',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey } = req.params;
      const contentItems =
        await ContentItemController.getContentItems(businessUnitKey);

      res.json(contentItems);
    } catch (error) {
      logger.error('Failed to get custom objects:', error);
      next(error);
    }
  }
);
contentItemRouter.get(
  '/:businessUnitKey/content-items/content-type/:contentType',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessUnitKey, contentType } = req.params;
      const contentItems = await ContentItemController.getContentItems(
        businessUnitKey,
        `value(type = "${contentType}")`
      );

      res.json(contentItems);
    } catch (error) {
      logger.error('Failed to get custom objects:', error);
      next(error);
    }
  }
);

contentItemRouter.get(
  '/:businessUnitKey/content-items/:key',
  async (req, res, next) => {
    try {
      const { key, businessUnitKey } = req.params;
      const contentItem = await ContentItemController.getContentItem(key);

      if (!contentItem) {
        throw new CustomError(404, 'Content item not found');
      }
      res.json(contentItem);
    } catch (error) {
      logger.error(
        `Failed to get custom object with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

contentItemRouter.get(
  '/:businessUnitKey/published/content-items/:key',
  async (req, res, next) => {
    try {
      const { key, businessUnitKey } = req.params;

      const object = await ContentItemController.getPublishedContentItem(
        businessUnitKey,
        key
      );
      if (!object) {
        throw new CustomError(404, 'Content item not found');
      }
      res.json(object);
    } catch (error) {
      logger.error(
        `Failed to get published content with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

contentItemRouter.post(
  '/:businessUnitKey/published/content-items/query',
  async (req, res, next) => {
    try {
      const { businessUnitKey } = req.params;
      const { query } = req.body;

      if (!query) {
        throw new CustomError(400, 'Query is required in the request body');
      }

      const object = await ContentItemController.queryContentItem(
        businessUnitKey,
        query,
        'published'
      );
      if (!object) {
        throw new CustomError(404, 'Content item not found');
      }
      res.json(object);
    } catch (error) {
      logger.error(
        `Failed to query published content with query ${req.body.query}:`,
        error
      );
      next(error);
    }
  }
);

contentItemRouter.post(
  '/:businessUnitKey/preview/content-items/query',
  async (req, res, next) => {
    try {
      const { businessUnitKey } = req.params;
      const { query } = req.body;

      if (!query) {
        throw new CustomError(400, 'Query is required in the request body');
      }

      const object = await ContentItemController.queryContentItem(
        businessUnitKey,
        query,
        ['draft', 'published']
      );
      if (!object) {
        throw new CustomError(404, 'Content item not found');
      }
      res.json(object);
    } catch (error) {
      logger.error(
        `Failed to query content with query ${req.body.query}:`,
        error
      );
      next(error);
    }
  }
);

contentItemRouter.get(
  '/:businessUnitKey/preview/content-items/:key',
  async (req, res, next) => {
    try {
      const { key, businessUnitKey } = req.params;
      logger.info(
        `Getting preview for content item ${key} in business unit ${businessUnitKey}`
      );
      const object = await ContentItemController.getPreviewContentItem(
        businessUnitKey,
        key
      );

      res.json(object);
    } catch (error) {
      logger.error(
        `Failed to get custom object with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

contentItemRouter.post('/:businessUnitKey/content-items', (async (
  req,
  res,
  next
) => {
  try {
    const { businessUnitKey } = req.params;
    const { value } = req.body;

    if (!value) {
      return res
        .status(400)
        .json({ error: 'Value is required in the request body' });
    }

    const object = await ContentItemController.createContentItem(
      businessUnitKey,
      value
    );
    res.status(201).json(object);
  } catch (error) {
    logger.error(
      `Failed to create custom object with key ${req.params.key}:`,
      error
    );
    next(error);
  }
}) as RequestHandler);

contentItemRouter.put('/:businessUnitKey/content-items/:key', (async (
  req,
  res,
  next
) => {
  try {
    const { businessUnitKey, key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res
        .status(400)
        .json({ error: 'Value is required in the request body' });
    }
    const object = await ContentItemController.updateContentItem(
      businessUnitKey,
      key,
      value
    );
    res.json(object);
  } catch (error) {
    logger.error(
      `Failed to update custom object with key ${req.params.key}:`,
      error
    );
    next(error);
  }
}) as RequestHandler);

contentItemRouter.delete(
  '/:businessUnitKey/content-items/:key',
  async (req, res, next) => {
    try {
      const { key, businessUnitKey } = req.params;
      await ContentItemController.deleteContentItem(businessUnitKey, key);
      res.status(204).send();
    } catch (error) {
      logger.error(
        `Failed to delete custom object with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

export default contentItemRouter;
