import { Router } from 'express';
import { logger } from '../utils/logger.utils';
import * as PageController from '../controllers/page.controller';

const pageRowRouter = Router();

pageRowRouter.delete(
  '/:businessUnitKey/pages/:key/rows/:rowId',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key, rowId } = req.params;
      const object = await PageController.removeRowFromPage(
        businessUnitKey,
        key,
        rowId
      );
      res.status(200).json(object);
    } catch (error) {
      logger.error(
        `Failed to remove row from page with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

pageRowRouter.post(
  '/:businessUnitKey/pages/:key/rows',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key } = req.params;
      const object = await PageController.addRowToPage(businessUnitKey, key);
      res.status(201).json(object);
    } catch (error) {
      logger.error(
        `Failed to add row to page with key ${req.params.key}:`,
        error
      );
      next(error);
    }
  }
);

pageRowRouter.put(
  '/:businessUnitKey/pages/:key/rows/:rowId/cells/:cellId',
  async (req, res, next) => {
    try {
      const { businessUnitKey, key, rowId, cellId } = req.params;
      const { updates } = req.body;

      const object = await PageController.updateCellSpanInPage(
        businessUnitKey,
        key,
        rowId,
        cellId,
        updates
      );
      res.status(200).json(object);
    } catch (error) {
      logger.error(
        `Failed to update cell span in page with key ${req.params.key}:`,
        error
      );

      next(error);
    }
  }
);

export default pageRowRouter;
