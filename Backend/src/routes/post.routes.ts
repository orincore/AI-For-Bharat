import { Router } from 'express';
import multer from 'multer';
import { postController } from '../controllers/post.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/posts', authenticateToken, upload.single('media'), (req, res) => postController.createPost(req, res));
router.post('/posts/:postId/publish', authenticateToken, (req, res) => postController.publishPost(req, res));
router.get('/posts', authenticateToken, (req, res) => postController.getUserPosts(req, res));
router.get('/posts/scheduled', authenticateToken, (req, res) => postController.getScheduledPosts(req, res));
router.delete('/posts/:postId', authenticateToken, (req, res) => postController.deletePost(req, res));
router.get('/posts/history', authenticateToken, (req, res) => postController.getPostHistory(req, res));

export default router;
