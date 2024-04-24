const express = require('express');
const userController = require('../controllers/userController.js');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: '/basic-face-match-main/selfies/' });

router.route('/login').post(userController.login);
router.route('/register').post(userController.register);
router.route('/logout').get(userController.logout);
router.route('/changePassowrd').put(userController.changePassword);
router.route('/changeEmail').put(userController.changeEmail);
router.route('/getClosest').get(upload.single('image'), userController.getClosest);
router.route('/changeActor').put(userController.changeActor);

module.exports = router;
