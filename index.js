const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express({ mergeParams: true });

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL during development
  methods: 'GET,POST,PUT,DELETE', // Specify the methods you want to allow
  credentials: true, // Enable if you use cookies or other credentials
}));

// Configure middleware
app.use(bodyParser.json());
app.use(express.static('frontend/dist'));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "your-mongo-uri";
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
