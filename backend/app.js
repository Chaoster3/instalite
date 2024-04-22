const express = require('express');
const userRouter = require('./routes/user_routes');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// register.register_routes(app);
app.use('/users', userRouter);

module.exports = app;