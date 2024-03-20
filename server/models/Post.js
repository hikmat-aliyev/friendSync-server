const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true},
  post_picture: {type: String},
  text: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  likes: [{ userId: {type: Schema.Types.ObjectId, ref: 'User'},
            username: {type: String}, 
            email: {type: String}},
         ],
  like_number: { type: Number, default: 0 },
  comments: [{ userId: {type: Schema.Types.ObjectId, ref: 'User'},
               text: {type: String},
               username: {type: String}, 
               email: {type: String}, 
               date: { type: Date, default: Date.now },}
            ],
  comment_number: { type: Number, default: 0 },
});

// When querying posts or comments, populate the 'user' field to get the user details.
PostSchema.pre('find', function (next) {
  this.populate('user', 'profile_pic');
  next();
});

// Virtual for User's URL
PostSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/User/${this.user}/Post/${this._id}`;
});

PostSchema.virtual("formatted_date").get(function () {
  return DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATE_MED);
}); 

// Export model
module.exports = mongoose.model("Post", PostSchema, "Posts");