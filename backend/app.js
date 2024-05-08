const express = require('express');
const userRouter = require('./routes/userRoutes');
const postsRouter = require('./routes/postsRoutes');
const commentsRouter = require('./routes/commentsRoutes');
const tagsRouter = require('./routes/tagsRoutes');

const cors = require('cors');
const chroma = require('./basic-face-match-main/app.js');
const path = require('path');
const app = express();
const session = require('express-session');
const signature = require('cookie-signature')
const kafka = require('./kafka.js')

let collection;

chroma.startChroma().then(col => collection = col);

// kafka.retrivePosts();

app.use((req, res, next) => {
  req.collection = collection;
  next();
});

const sessionMiddleWear = session({
  secret: 'nets2120_insecure',
  saveUninitialized: true,
  cookie: {
    httpOnly: false,
    sameSite: "none",
    secure: false
  },
  resave: true
})

app.use(sessionMiddleWear);

app.use((req, res, next) => {
  const myNext = () => {
    var name = 'connect.sid'
    const secret = 'nets2120_insecure'
    var signed = 's:' + signature.sign(req.sessionID, secret)

    const sessionIDCookieValue = req.sessionID;
    res.cookie("connect.sid", signed, {
      secure: "false",
      sameSite: "none"
    });

    next();
  }
  sessionMiddleWear(req, res, myNext);
})

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '/images')));
app.use(cors({ credentials: true, origin: true }));

app.use(session({
  secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

app.use('/users', userRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/tags', tagsRouter);

module.exports = app;