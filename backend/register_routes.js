const { DefaultDeserializer } = require('v8');
const routes = require('./routes.js');

module.exports = {
    register_routes
};

function register_routes(app) {
    app.post('/image_match', routes.image_match);
    app.post('/login', routes.login);
    app.post('/register', routes.register);
    app.get('/logout', routes.logout);
};