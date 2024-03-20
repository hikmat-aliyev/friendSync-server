const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  profile_pic: {type: String, default: null},
  birth_date: { type: Date },
  email: { type: String, required: true, maxLength: 100 },
  password: { type: String, minLength: 3 },
  allPosts: [{postId: {type: Schema.Types.ObjectId, ref: 'Post'}}],
  friends: [{ profileId: {type: Schema.Types.ObjectId, ref: 'User'},
              fullName: {type: String}, 
              email: {type: String}, 
              birthDate: { type: Date},}],
  receivedRequests: [{ userId: {type: Schema.Types.ObjectId},
                       fullName: {type: String}, 
                       email: {type: String}, 
                       birthDate: { type: Date},}],         
});

// Virtual for User's full name
UserSchema.virtual("name").get(function () {
  // To avoid errors in cases where an User does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullName = "";
  if (this.first_name && this.family_name) {
    fullName = `${this.last_name}, ${this.first_name}`;
  }
  return fullName;
});

// Virtual for User's URL
UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/User/${this._id}`;
});

UserSchema.virtual("formatted_birth_date").get(function () {
  return DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
}); 

// Export model
module.exports = mongoose.model("User", UserSchema, "Users");