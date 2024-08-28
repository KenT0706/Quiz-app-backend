const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express({ mergeParams: true });

// Configure middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend/dist'));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/QuizApp";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Could not connect to MongoDB', err);
});

// Include the user registration route
app.use('/auth', require('./routes/auth'));
app.use('/quiz/', require('./routes/quizQuestion'));
app.use('/quiz', require('./routes/quiz'));

// Start the server
const port = process.env.SERVING_PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
