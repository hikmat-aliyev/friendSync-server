const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const users = await User.find();
  const userInfo = req.body.user;
  let userNamesArray = []
  users.forEach(user => {
    if(user._id.toString() !== userInfo._id.toString()){
      userNamesArray.push({ 
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_pic: user.profile_pic})
    }
  })
  res.send(userNamesArray)
})

router.post('/add', async (req, res) => {
  const profile = req.body.profile;
  const user = req.body.user;
  try{
    const userWithRequest = await User.findByIdAndUpdate(
      profile._id,
      {
        $push: { receivedRequests: {userId: user._id,
                                  fullName: user.firstName + ' ' + user.lastName,
                                  email: user.email,
                                  }
                }
      }
      );
      await userWithRequest.save();
      res.json(userWithRequest);
  }catch(err){
    res.status(500).send('Could not add the friend')
  }
})

router.post('/cancel/request', async (req, res) => {  
  const profile = req.body.profile;
  const userInfo = req.body.user;
  try {
    // First find the user
    const userWithRequest = await User.findById(profile._id);
    //filter the comments array and return the proper array
    const newCommentArray = userWithRequest.receivedRequests.filter((request) =>{
      return request.userId != userInfo._id
    });
    //assign new array to friendRequests array
    userWithRequest.receivedRequests = newCommentArray;
    await userWithRequest.save();
    res.json(userWithRequest);
  } catch (error) {
    console.error('Error in /like endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/check/request', async (req, res) => {
  const userInfo = req.body.user;
  const profileInfo = req.body.profile;
  const profileUser = await User.findById(profileInfo._id);
  const mainUser = await User.findById(userInfo._id);

  //check if the main user id is in the profile's receivedRequest array
  const isRequestSent = profileUser.receivedRequests.some(request => request.userId == userInfo._id);
  //check if the profile user is in main user's receivedRequest array
  const isRequestReceived = mainUser.receivedRequests.some(request => request.userId == profileInfo._id);

  res.send({
    isRequestReceived: isRequestReceived,
    isRequestSent: isRequestSent
  });
})

router.post('/check/request-received', async (req, res) => {
  const userInfo = req.body.user;
  const profileInfo = req.body.profile;
  console.log(userInfo)
  console.log(profileInfo)
  const mainUser = await User.findById(userInfo._id);
  //check if the profile user is in main user's receivedRequest array
  const isRequestReceived = mainUser.receivedRequests.some(request => request.userId == profileInfo._id);
  res.send(isRequestReceived)
})

router.post('/requests', async (req, res) => {
  const userInfo= req.body.user;
  const user = await User.findById(userInfo._id);
  const requestArray = user.receivedRequests;
  res.send(requestArray);
})


router.post('/accept/request', async (req, res) => {
  const profile = req.body.profile;
  const mainUser = req.body.user;
  try{
    const user = await User.findByIdAndUpdate(
      mainUser._id,
      {
        $push: { friends: {profileId: profile._id,
                                  fullName: profile.first_name + ' ' + profile.last_name,
                                  email: profile.email,
                                  }
                }
      }
      );

      const profileUser = await User.findByIdAndUpdate(
        profile._id,
        {
          $push: { friends: {profileId: mainUser._id,
                                    fullName: mainUser.firstName + ' ' + mainUser.lastName,
                                    email: mainUser.email,
                                    }
                  }
        }
        );

      const updatedRequestArray = user.receivedRequests.filter(request => request.userId != profile._id);
      user.receivedRequests = updatedRequestArray;

      await user.save();
      await profileUser.save();
      res.send(true)
  }catch(err){
    res.status(500).send('Could not add the friend')
  }
})

router.post('/remove/friend', async (req, res) => {
  const profile = req.body.profile;
  const mainUser = req.body.user;
  try{
    const user = await User.findByIdAndUpdate(mainUser._id);
    const profileUser = await User.findById(profile._id);

    //remove the profile user from friends array of main user
    const userFriendsArray = user.friends.filter(friend => friend.profileId != profile._id);
    user.friends = userFriendsArray;
    //remove the main user from profile's friends array
    const profileFriendsArray = profileUser.friends.filter(friend => friend.profileId != mainUser._id);
    profileUser.friends = profileFriendsArray;

    await user.save();
    await profileUser.save();
    res.send(true);
  }catch(err){
    res.status(500).send('Could not add the friend')
  }
})


router.post('/remove/request', async (req, res) => {
  const mainUser = req.body.user;
  const profile = req.body.profile;
  try{
    const user = await User.findByIdAndUpdate(mainUser._id);
    //remove the profile user from receivedRequests array of main user
    const userReceivedArray = user.receivedRequests.filter(request => request.userId != profile._id);
    user.receivedRequests = userReceivedArray;

    await user.save();
    res.send(true);
  }catch(err){
    res.status(500).send('Could not add the friend')
  }
})

router.post('/check/friend', async (req, res) => {
  const userInfo = req.body.user;
  const profile = req.body.profile;
  try{
    const user = await User.findById(userInfo._id);
    const isFriend = user.friends.some(friend => friend.profileId == profile._id);
    res.send(isFriend);
  }catch(err){
    console.log(err)
  }
})

module.exports = router;