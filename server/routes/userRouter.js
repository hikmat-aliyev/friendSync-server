const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email' });
    }

    if (user.password === undefined) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Set expiration time to 30 days from now
    const expiresIn = '30d';

    // If authentication is successful, generate a JWT
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      'yourSecretKey', {expiresIn}
    );

    // Send the JWT to the client
    res.json({ token, user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/google/sign-in', async (req, res) => {
  const data = req.body;

  try{
    const user = await User.findOne({email: data.email});
    if(!user) {
      console.log('no user')
      res.status(404).send(data);
    }
    if(user){
      const expiresIn = '30d';
      //if authentication successful, generate a JWT
      const token = jwt.sign(
        {
          _id: user._id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        'yourSecretKey', {expiresIn}
      )
      //send the jwt to the client
      res.json({token})
      }
  } catch(err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Verify the token with your secret key
    const decoded = jwt.verify(token, 'yourSecretKey');

    // Attach the decoded user information to the request object
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Protected route to fetch user information
router.post('/', verifyToken, async (req, res) => {
  // Access the user information from the request object
  const user = req.user;
  const userFromDatabase = await User.findById(user._id)

  // Respond with the user information
  res.json({
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profile_pic: userFromDatabase.profile_pic
  });
});

router.post('/sign-up', async (req, res) => {
  const {firstName, lastName, email, birthDate, password} = req.body;
  hashedPassword = await bcrypt.hash(password, 10)
  try{
    const existUser = await User.findOne({email: email});
    if(existUser) {
      res.status(409).json({message: 'User is already exist'})
      return
    }

    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email: email,
      birth_date: birthDate,
      password: hashedPassword
    })
  
    await user.save();
    const expiresIn = '30d';
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        birthDate: user.birth_date
      },
      'yourSecretKey', {expiresIn}
    )
    res.json({token})
  }catch(err){
    console.log(err)
  }
})

router.post('/google/sign-up', async (req, res) => {
  const data = req.body;
  const userInfo = data.userData;

  try{
    let user = await User.findOne({email: userInfo.email});
    if(!user) {
      user = await User.create({
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        email: userInfo.email,
      })
      if(userInfo.birthDate){
        user.birth_date = userInfo.birthDate;
      }
      await user.save()
    }
    const expiresIn = '30d';
    //if authentication successful, generate a JWT
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      'yourSecretKey', {expiresIn}
    )
    //send the jwt to the client
    res.json({token})
  } catch(err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
