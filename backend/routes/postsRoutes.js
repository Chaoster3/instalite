const express = require('express');
const postsController = require('../controllers/postsController.js');
const router = express.Router();

router.route('/createPost').post(postsController.createPost);
router.route('/getPost/:postId').post(postsController.getPost);
