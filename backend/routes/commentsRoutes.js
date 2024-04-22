const express = require('express');
const commentsController = require('../controllers/commentsController.js');
const router = express.Router();

router.route('/').get(commentsController.getAllComments);
router.route('/createComment/:postId').post(commentsController.createComment);
router.route('/getComment/:commentId').get(commentsController.getComment);


module.exports = router;
