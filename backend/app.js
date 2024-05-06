const express = require('express');
const userRouter = require('./routes/userRoutes');
const postsRouter = require('./routes/postsRoutes');
const commentsRouter = require('./routes/commentsRoutes');
const tagsRouter = require('./routes/tagsRoutes');

const cors = require('cors');
const app = express();
const session = require('express-session');
const signature = require('cookie-signature')

app.use(express.json());
app.use(cors({ credentials: true, origin: true }));


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


//cookie fixing middleware
app.use((req, res, next) => {
  const myNext = () => {
    //print out cookies in res
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


app.use('/users', userRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/tags', tagsRouter);

module.exports = app;