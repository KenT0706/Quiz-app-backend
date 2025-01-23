if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Load .env file variables into process.env
}
console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debugging: Check if the variable is set

// Debugging: Log environment variables to verify they're set
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('SECRET_KEY:', process.env.SECRET_KEY);

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
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://kenktent:Short@aa@kenblitz.gka5p.mongodb.net/QuizApp?retryWrites=true&w=majority";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Could not connect to MongoDB', err);
  if (!mongoURI) {
    console.error('MONGODB_URI is not defined. Check your environment variables!');
    process.exit(1);
}
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

app.use((req, res, next) => {
      console.log(`Received ${req.method} request at ${req.url}`);
      console.log('Body:', req.body);
      next();
  });
  