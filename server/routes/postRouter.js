const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');

router.post('/submit', async (req, res) => {
  const data = req.body;
  const userInfo = data.user;
  const postInfo = data.createdPost;
  const postImage = data.postImage;
  const user = await User.findById({_id: userInfo._id})
  const fullName = user.first_name + " "  + user.last_name;
  try{
    const post = await Post.create({
      user: user._id,
      username: fullName,
      text: postInfo,
      post_picture: postImage,
      date: new Date()
    })

    await post.save();

    user.allPosts.push({postId: post._id})
    user.save()
    
    for(const friend of user.friends){
      const friendUser = await User.findById(friend.profileId)
      friendUser.allPosts.push({postId: post._id})
      friendUser.save()
    }

    const totalPosts = []

    for(const item of user.allPosts){
      const post =await Post.findById(item.postId)
                            .populate('user')
                            .populate('comments.userId')
                            .populate('likes.userId')
                            .sort({ date: -1 })
                            .exec()
      totalPosts.push(post)
    }
    // Sort totalPosts array by date in descending order
    totalPosts.sort((a, b) => b.date - a.date);
    res.json(totalPosts)
  }catch(err){
    res.status(500).send('Could not submit the post')
  }
})

router.post('/profile-homepage/get-posts', async (req, res) => {
  const data = req.body;
  const userInfo = data.postOwner;
  const posts = await Post
                      .find({user: userInfo._id})
                      .populate('user')
                      .populate('comments.userId')
                      .populate('likes.userId')
                      .sort({ date: -1 })
                      .exec()

  res.json(posts);
})

router.post('/homepage/get-posts', async (req, res) => {
  const data = req.body;
  const userInfo = data.postOwner;
  try{
    const user = await User.findById(userInfo._id);
    const totalPosts = []
    for(const item of user.allPosts){
      const post =await Post.findById(item.postId)
                            .populate('user')
                            .populate('comments.userId')
                            .populate('likes.userId')
                            .exec()
      totalPosts.push(post)
    }
    if(totalPosts.length > 0){
      totalPosts.sort((a, b) => b.date - a.date);
    }
    res.json(totalPosts)
  }catch(err){
    console.log(err)
    res.status(500).send(err)
  }
})

router.post('/delete', async (req, res) => {
  try{
    const data = req.body;
    const userInfo = data.user;
    await Post.findOneAndDelete({_id: data.postId});

    const mainUser = await User.findById(userInfo._id);

    //get new allPosts by removing the removed post from the allPosts  array
    const newAllPosts = mainUser.allPosts.filter(post => post.postId != data.postId)
    mainUser.allPosts = newAllPosts;
    mainUser.save();

    //remove the post from the main user's friends' allPosts arrays
    for(const friend of mainUser.friends){
      const friendUser = await User.findById(friend.profileId)
      const newFriendAllPosts = friendUser.allPosts.filter(post => post.postId != data.postId)
      friendUser.allPosts = newFriendAllPosts
      friendUser.save()
    }
    
    const allPostsToSend = []
    for(const item of mainUser.allPosts){
      const post =await Post.findById(item.postId)
                            .populate('user')
                            .populate('comments.userId')
                            .populate('likes.userId')
                            .sort({ date: -1 })
                            .exec()
      allPostsToSend.push(post) 
    }
        
    res.json(allPostsToSend);
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/like', async (req, res) => {
  try {
    const data = req.body;
    const userInfo = data.user;
    const postOwner = data.postOwner;
    
    // Find the post by _id and update the like_number
    const updatedPost = await Post.findByIdAndUpdate(
      data.postId,
      // Increment the like_number by 1
      { $inc: { like_number: 1 },
      //add user full name and email to likes array
        $push: { likes: {userId: userInfo._id, username: userInfo.firstName + ' ' + userInfo.lastName,
                          email: userInfo.email }} },
      { new: true } // Return the updated document
    );
    await updatedPost.save();
    // Find all posts for the postOwner and sort them
    const posts = await Post.find({ user: postOwner._id }).sort({ date: -1 }).exec();
    res.json(posts);
  } catch (error) {
    console.error('Error in /like endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/unlike', async (req, res) => {
  try {
    const data = req.body;
    const userInfo = data.user;
    const postOwner = data.postOwner;
    
    // Find the post by _id and update the like_number
    const updatedPost = await Post.findByIdAndUpdate(
      data.postId,
      // Increment the like_number by 1
      { $inc: { like_number: -1 },
      //add user full name and email to likes array
        $pull: { likes: {email: userInfo.email }} },
      { new: true } // Return the updated document
    );
    await updatedPost.save();
    // Find all posts for the postOwner and sort them
    const posts = await Post.find({ user: postOwner._id }).sort({ date: -1 }).exec();
    res.json(posts);
  } catch (error) {
    console.error('Error in /like endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/comment', async (req, res) => {
  try {
    const data = req.body;  
    const userInfo = data.user;
    const postOwner = data.postOwner;
    // Find the post by _id and update the like_number
    const updatedPost = await Post.findByIdAndUpdate(
      data.postId,
      // Increment the like_number by 1
      { $inc: { comment_number: 1 },
      //add comment text, user full name and email to likes array
        $push: {comments: { userId: userInfo._id,
                            text: data.commentText,
                            username: userInfo.firstName + ' ' + userInfo.lastName,
                            email: userInfo.email }} },

      { new: true } // Return the updated document
    );
    await updatedPost.save();

    const user = await User.findById(userInfo._id)

    const totalPosts = []
    
    //find all posts based on the IDs that we store in user's allPosts 
    //where these IDs reference to single Post
    for(const item of user.allPosts){
      const post =await Post.findById(item.postId)
                            .populate('user')
                            .populate('comments.userId')
                            .populate('likes.userId')
                            .exec()
      totalPosts.push(post)
    }
    // Sort totalPosts array by date in descending order
    totalPosts.sort((a, b) => b.date - a.date);
    res.json(totalPosts);
  } catch (error) {
    console.error('Error in /like endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/comment/delete', async (req, res) => {  
  try {
    const postId = req.body.postId;
    const postOwner = req.body.postOwner;
    const commentId = req.body.commentId;
    // First find the post
    const post = await Post.findOne({_id: postId});
    //filter the comments array and return the proper array
    const newCommentArray = post.comments.filter((comment) =>{
      return comment._id.toString() !== commentId.toString();
    });
    //assign new array to post comments array
    post.comments = newCommentArray;
     //decrease comment number
     post.comment_number = post.comment_number - 1;
    await post.save()
    // Find all posts for the user and sort them
    const posts = await Post.find({ user: postOwner._id })
                            .populate('user')
                            .populate('comments.userId')
                            .populate('likes.userId')
                            .sort({ date: -1 })
                            .exec();
    res.json(posts);
  } catch (error) {
    console.error('Error in /like endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/update', async (req, res) => {
  const postId = req.body.post._id;
  const editedText = req.body.editedText;
  const editedImage = req.body.editedImage;
  try{
    const post = await Post.findById(postId)
                            .populate('user')
                            .exec();
    if(!post) {
      return res.status(404).send('Post not found');
    }
     // Update the post's text and image
     post.text = editedText;
     post.post_picture = editedImage;
     await post.save();
     res.status(200).send(post);
  }catch(err) {
    res.status(505).send('Could not edit the post')
  }
})

router.post('/update/comment', async (req, res) => {
  const postData = req.body.postInfo;
  const commentData = req.body.commentInfo;
  const editedText = req.body.editedCommentText;
  try {
    const post = await Post.findById(postData._id)
    post.comments.forEach(comment => {
      if(comment._id.toString() == commentData._id.toString()){
        comment.text = editedText
      }
    })
    post.save()
  }catch(err){
    res.status(505).send('Could not edit the comment')
  }
  
})


module.exports = router;