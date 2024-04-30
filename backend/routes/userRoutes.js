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
router.route('/resetPassword').post(authController.resetPassword);
router.route('/checkIfLoggedIn').get(authController.checkIfLoggedIn); // returns true if the user is logged in

// User routes
router.route('/getFiveClosestActors').get(userController.getFiveClosestActors); // need to verify that it works
router.route('/changeActor').put(userController.changeActor); // need to verify that it works
router.route('/uploadProfilePicture').put(userController.uploadProfilePicture); // need to verify that it works

// get all the current user's friends
router.route('/getAllFriends').get(userController.getAllFriends);
router.route('/getPostsMainPage').get(userController.getPostsMainPage);
router.route('/getPostsProminentFigures').get(userController.getPostsProminentFigures); // TODO: implement this
router.route('/addFriends').post(userController.addFriends);
router.route('/removeFriends').post(userController.removeFriends);

module.exports = router;
