if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express({ mergeParams: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Default root route
app.get('/', (req, res) => {
  res.send('Quiz App Backend is running');
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "your-default-mongodb-uri";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/quiz/', require('./routes/quizQuestion'));
app.use('/quiz', require('./routes/quiz'));

// Error handling
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.all('*', (req, res) => {
  console.error(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).send('Route not found');
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});


// Start server
const port = process.env.SERVING_PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
