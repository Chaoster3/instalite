const express = require('express');
const userRouter = require('./routes/userRoutes');
const postsRouter = require('./routes/postsRoutes');
const commentsRouter = require('./routes/commentsRoutes');
const tagsRouter = require('./routes/tagsRoutes');

const cors = require('cors');
const chroma = require('./basic-face-match-main/app.js');
const path = require('path');
const { ConnectContactLens } = require('aws-sdk');
const app = express();
const session = require('express-session');

let collection;

chroma.startChroma().then(col => collection = col);

console.log('bbadfbsdfbsdfbsdf');
console.log(collection);

app.use((req, res, next) => {
    req.collection = collection;
    console.log(collection);
    next();
});

app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'basic-face-match-main/images')));

app.use(session({
  secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

app.use('/users', userRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/tags', tagsRouter);

module.exports = app;