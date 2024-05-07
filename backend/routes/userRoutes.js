const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authenticationController.js');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: '/profile_pics/' });


// Authentication routes
router.route('/register').post(userController.register);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/changePassword').put(authController.changePassword);
router.route('/changeEmail').put(authController.changeEmail);
router.route('/getResetLink').get(authController.getResetLink);
router.route('/resetPassword').post(authController.resetPassword);
router.route('/checkIfLoggedIn').get(authController.checkIfLoggedIn); // returns true if the user is logged in

// User routes
router.route('/getClosest').post(upload.single('profile_pic'), userController.getClosest);
router.route('/changeActor').put(userController.changeActor); // need to verify that it works

// get all the current user's friends
router.route('/getAllFriends').get(userController.getAllFriends);
router.route('/getPostsMainPage').get(userController.getPostsMainPage);
router.route('/getPostsProminentFigures').get(userController.getPostsProminentFigures); // TODO: implement this
router.route('/addFriends').post(userController.addFriends);
router.route('/removeFriends').post(userController.removeFriends);
router.route('/sendFriendRequest').post(userController.sendFriendRequest);

router.route('/getUsernameFromID/:userId').get(userController.getUsernameFromID);

// Liking and unliking posts
router.route('/likePost/:postId').get(userController.likePost);
router.route('/getLikedPosts').get(userController.getLikedPosts);
router.route('/unlikePost/:postId').get(userController.unlikePost);
router.route('/checkIfLikedPost/:postId').get(userController.checkIfLikedPost);

// Friend recommendation
router.route('/getFriendRecommendation').get(userController.getFriendRecommendation);


module.exports = router;
