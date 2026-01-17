import { logger } from '../utils/logger.utils';
import { Router } from 'express';
import * as PageController from '../controllers/page.controller';

const pageComponentRouter = Router();

pageComponentRouter.post(
  '/:businessUnitKey/pages/:key/components',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key } = req.params;
      const { componentType, rowId, cellId } = req.body;
      const object = await PageController.addContentItemToPage(
        businessUnitKey,
        key,
        componentType,
        rowId,
        cellId
      );
      res.status(201).json(object);
    } catch (error) {
      logger.error(
        `Failed to add component to page with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

pageComponentRouter.put(
  '/:businessUnitKey/pages/:key/components/:contentItemKey',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key, contentItemKey } = req.params;
      const { updates } = req.body;
      const object = await PageController.updateComponentInPage(
        businessUnitKey,
        key,
        contentItemKey,
        updates
      );
      res.status(200).json(object);
    } catch (error) {
      logger.error(
        `Failed to update component in page with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

pageComponentRouter.delete(
  '/:businessUnitKey/pages/:key/components/:contentItemKey',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key, contentItemKey } = req.params;
      const object = await PageController.removeComponentFromPage(
        businessUnitKey,
        key,
        contentItemKey
      );
      res.status(200).json(object);
    } catch (error) {
      logger.error(
        `Failed to remove component from page with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

export default pageComponentRouter;
