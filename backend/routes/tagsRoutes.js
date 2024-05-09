const express = require('express');
const tagsController = require('../controllers/tagsController.js');
const router = express.Router();

router.route('/').get(tagsController.getAllTagNames);
router.route('/createTag').post(tagsController.createTag);
router.route('/findTopTenTags').get(tagsController.findTopTenTags);

// Let users update their interests (hashtags)
router.route('/updateUserHashTags').post(tagsController.updateUserHashTags);

// Let users search for specific hashtags
router.route('/searchHashTags/:q').get(tagsController.searchHashTags);

module.exports = router;