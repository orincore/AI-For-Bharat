import { Router } from 'express';
import { contentController } from '../controllers/content.controller';

const router = Router();

router.post('/content/sync', contentController.syncContentLibrary.bind(contentController));
router.get('/content/:userId', contentController.getContentLibrary.bind(contentController));
router.delete('/content/:contentId', contentController.deleteContent.bind(contentController));

export default router;
