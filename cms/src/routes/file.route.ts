import { logger } from '../utils/logger.utils';
import multer from 'multer';
import { FileControllerFactory } from '../controllers/file-controller';
import { Router, RequestHandler } from 'express';
import { CustomObjectController } from '../controllers/custom-object.controller';
import { bundleCode } from '../utils/bundler.utils';
import { CONTENT_TYPE_CONTAINER } from '../constants';

const fileRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });
const fileController = FileControllerFactory.createFileController();

fileRouter.post(
  '/:businessUnitKey/upload-file',
  upload.single('file') as any,
  (async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const { businessUnitKey } = req.params;

      const title = req.body.title || '';
      const description = req.body.description || '';

      const fileUrl = await fileController.uploadFile(
        req.file,
        businessUnitKey,
        {
          title,
          description,
        }
      );

      res.json({ url: fileUrl });
    } catch (error) {
      logger.error('Failed to upload file:', error);
      next(error);
    }
  }) as RequestHandler
);

fileRouter.get('/:businessUnitKey/media-library', (async (req, res, next) => {
  try {
    const { businessUnitKey } = req.params;

    const extensions = req.query.extensions
      ? String(req.query.extensions).split(',')
      : [];
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await fileController.getMediaLibrary(
      extensions,
      page,
      limit,
      businessUnitKey
    );
    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch media library:', error);
    next(error);
  }
}) as RequestHandler);

fileRouter.post('/compile-upload', (async (req, res, next) => {
  try {
    const { files, key } = req.body;

    const allFiles = Object.keys(files).map((key) => {
      return {
        filename: key,
        content: files[key].content,
      };
    });

    const codeFiles = allFiles.filter((file) => file.filename.endsWith('.ts'));

    if (!codeFiles?.length) {
      return res.status(400).json({ error: 'No code provided' });
    }

    if (!key) {
      return res.status(400).json({ error: 'No component key provided' });
    }

    // Create a JS file in memory
    const fileName = `${key}.js`;

    // Compile the code using our bundler utility
    const code = await bundleCode(allFiles, key);
    logger.info('code');
    logger.info(code);

    // Use Buffer to create a file-like object that matches Express.Multer.File
    const jsFile: any = {
      buffer: Buffer.from(code),
      originalname: fileName,
      mimetype: 'application/javascript',
      encoding: '7bit',
      size: code.length,
      fieldname: 'file',
      destination: `deployed-content-types`,
      filename: fileName,
      path: `deployed-content-types/${fileName}`,
    };

    // Upload the compiled JS file
    const fileUrl = await fileController.uploadFile(
      jsFile,
      'deployed-content-types'
    );

    const contentTypeController = new CustomObjectController(
      CONTENT_TYPE_CONTAINER
    );

    const contentType = await contentTypeController.getCustomObject(key);

    contentType.value.deployedUrl = fileUrl;
    contentType.value.code = codeFiles;

    await contentTypeController.updateCustomObject(key, contentType.value);

    res.json({
      success: true,
      url: fileUrl,
    });
  } catch (error) {
    logger.error('Failed to compile and upload:', error);
    next(error);
  }
}) as RequestHandler);

export default fileRouter;
