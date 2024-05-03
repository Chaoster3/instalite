  const express = require('express');
const userRouter = require('./routes/userRoutes');
const postsRouter = require('./routes/postsRoutes');
const commentsRouter = require('./routes/commentsRoutes');
const tagsRouter = require('./routes/tagsRoutes');

const cors = require('cors');
const app = express();
const session = require('express-session');

app.use(express.json());
app.use(cors({credentials:true, origin: true}));

app.use(session({
  secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

app.use('/users', userRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/tags', tagsRouter);

module.exports = app;