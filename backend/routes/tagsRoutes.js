const express = require('express');
const tagsController = require('../controllers/tagsController.js');
const router = express.Router();

router.route('/').get(tagsController.getAllTags);
router.route('/createTag').post(tagsController.createTag);
router.route('/findTopTenTags').get(tagsController.findTopTenTags);

module.exports = router;