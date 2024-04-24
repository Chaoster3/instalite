const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authenticationController.js');
const router = express.Router();

// Authentication routes
router.route('/register').post(authController.register);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/changePassword').put(authController.changePassword);
router.route('/changeEmail').put(authController.changeEmail);

// User routes 
router.route('/getFiveClosestActors').get(userController.getFiveClosestActors);
router.route('/changeActor').put(userController.changeActor);

module.exports = router;
