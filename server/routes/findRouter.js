const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.post('/owner', async(req, res) => {
  const profileId = req.body.profileId;
  const profile = await User.findById(profileId)
  res.send(profile);
})

router.post('/friends', async (req, res) => {
  const userInfo = req.body.user;
  try {
    const user = await User.findById(userInfo._id);
    const friends = user.friends;
    const updatedFriends = [];
    
    for (const friend of friends) {
      const friendUser = await User.findById(friend.profileId)
      // Convert Mongoose document to a plain JavaScript object
      const friendObject = friend.toObject();
      //add profile pic of user to the friendObject
      friendObject.picture = friendUser.profile_pic;
      //add it to updatedFriends
      updatedFriends.push(friendObject);
    }
    
    res.send(updatedFriends);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


router.post('/profile/image', async(req, res) => {
  const userInfo = req.body.profile;
  try{
    const user = await User.findById(userInfo._id)
    const image = user.profile_pic;
    if(!image){
      res.send(false)
    }else res.send(image)
  }catch(err){
    res.status(505)
  }
})

module.exports = router;