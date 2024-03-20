const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/upload/profile', async(req, res) => {
  const userInfo = req.body.profile;
  const image = req.body.newImage;
  try{
    const user = await User.findById(userInfo._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.profile_pic = image;
    await user.save();
    res.send(true);
  }catch(err){
    console.log(err)
    res.json({message: err.message});
  }
})

router.post('/remove/profile', async(req, res) => {
  const userInfo = req.body.profile;
  try{
    const user = await User.findOneAndUpdate(
      { _id: userInfo._id },
      { $unset: { profile_pic: 1 } },
      { new: true } // returns the modified document
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.save();
    res.send(true);
  }catch(err){
    console.log(err)
    res.json({message: err.message});
  }
})


module.exports = router;
