const express = require('express');
const server = express();
require('dotenv').config();
const bodyParser = require('body-parser')
const cors = require('cors');

 //limit to 5MB 
const bodyParserOptions = {
  limit: '5mb',
};

// Use body-parser middleware with the specified options
server.use(bodyParser.json(bodyParserOptions));
server.use(bodyParser.urlencoded({ extended: true, ...bodyParserOptions }));

// Parse JSON bodies
server.use(express.json());
server.use(cors());
//set up mongoose
const mongoose = require("mongoose");
const mongoDb = process.env.DATABASE_STRING;

mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const userRouter = require('./routes/userRouter');
const postRouter = require('./routes/postRouter');
const profileRouter = require('./routes/profileRouter');
const findRouter = require('./routes/findRouter');
const pictureRouter = require('./routes/pictureRouter');

server.use('/user', userRouter);
server.use('/post', postRouter);
server.use('/profiles', profileRouter);
server.use('/find', findRouter);
server.use('/picture', pictureRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
