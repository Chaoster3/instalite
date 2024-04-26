const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authenticationController.js');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: '/basic-face-match-main/selfies/' });

router.route('/login').post(userController.login);
router.route('/register').post(userController.register);
router.route('/logout').get(userController.logout);
router.route('/changePassowrd').put(userController.changePassword);
router.route('/changeEmail').put(userController.changeEmail);
router.route('/getFiveClosestActors').get(userController.getFiveClosestActors);
router.route('/changeActor').put(userController.changeActor);
router.route('/getClosest').get(upload.single('image'), userController.getClosest);

module.exports = router;