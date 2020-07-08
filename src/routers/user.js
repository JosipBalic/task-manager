const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {
  sendWelcomeEmail,
  sendCancelationEmail,
} = require('../emails/account');

const router = new express.Router();

/* FOR TESTING */
//sendWelcomeEmail('donmafijozo@gmail.com', 'Test');

/*
  POST: Creating a user
    neccessary input: name, password, unique email
    optional input: age
{
    "name": "Test",
    "email": "tes5t@mail.com",
    "password": "red1234",
    "age": 20
}

  response: 201 if everything ok and email was sent
            400 if user couldn't be created or email was not sent
*/
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    // in case email isn't send, dont raise an error
    try {
      sendWelcomeEmail(user.email, user.name);
    } catch (e) {}
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/* POST: Login of the user
  necessary input: correct email and password
  result: either correct login or failed login
*/
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password,
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

/*
  POST: Logout of the user
    if user is authenticated he also has to logout
*/
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/*
  POST: Logout of everything for user
    clearing of all user tokens
    user has to be authenticated
*/
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/*
  GET: method that reads all user data, sensitive user information is filtered
*/
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

/*
  POST: update of user data
    name, email, password and age can be updated
    200 if everything is ok and
*/
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach(
      (update) => (req.user[update] = req.body[update]),
    );
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/*
  DELETE: simple delete of all user data
    cancelation email is also sent to the user
    deleted user data will be returned filtered with sensitive information
*/
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    try {
      sendCancelationEmail(req.user.email, req.user.name);
    } catch (e) {}
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image.'));
    }

    cb(undefined, true);
  },
});

/*
  POST: a method to upload desired picture/avatar of the current user
*/
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  },
);

/*
  DELETE: deletion of avatar for currently logged user
*/
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

/* 
  GET: get avatar for a currently logged user
  picture and data can be viewed in web browser on the following URL:
    http://localhost:3000/users/5f057811908eec2b34248426(ID of the User)/avatar
*/
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
