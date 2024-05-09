const express = require('express');
const postsController = require('../controllers/postsController.js');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: '/image_uploads/' });

router.route('/createPost').post(upload.single('image'), postsController.createPost);
router.route('/getPost/:postId').get(postsController.getPost);
router.route('/').get(postsController.getAllPosts);
router.route('/trendingPosts').get(postsController.getTrendingPosts);

module.exports = router;