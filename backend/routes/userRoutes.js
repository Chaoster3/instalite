const express = require('exoress');
const userController = require('../controllers/userController.js');
const router = express.Router();

router.route('/login').post(userController.login);
router.route('/register').post(userController.register);
router.route('/logout').get(userController.logout);

// function register_routes(app) {
//   // app.post('/image_match', userController.image_match);
//   app.post('/login', userController.login);
//   app.post('/register', userController.register);
//   app.get('/logout', userController.logout);
// }

module.exports = router;
