const express = require('express');
const userRouter = require('./routes/userRoutes');
const postsRouter = require('./routes/postsRoutes');
const commentsRouter = require('./routes/commentsRoutes');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());


app.use('/users', userRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);

module.exports = app;