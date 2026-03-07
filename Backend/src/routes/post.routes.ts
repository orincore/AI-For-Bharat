import { Router } from 'express';
import multer from 'multer';
import { postController } from '../controllers/post.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/posts', upload.single('media'), postController.createPost.bind(postController));
router.post('/posts/:postId/publish', postController.publishPost.bind(postController));
router.get('/posts/user/:userId', postController.getUserPosts.bind(postController));
router.get('/posts/scheduled/:userId', postController.getScheduledPosts.bind(postController));
router.delete('/posts/:postId', postController.deletePost.bind(postController));

export default router;
