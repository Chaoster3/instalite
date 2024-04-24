const express = require('express');
const userController = require('../controllers/userController.js');
const router = express.Router();

router.route('/register').post(userController.register);
router.route('/login').post(userController.login);
router.route('/logout').get(userController.logout);
router.route('/changePassowrd').put(userController.changePassword);
router.route('/changeEmail').put(userController.changeEmail);
router.route('/getFiveClosestActors').get(userController.getFiveClosestActors);
router.route('/changeActor').put(userController.changeActor);

module.exports = router;
