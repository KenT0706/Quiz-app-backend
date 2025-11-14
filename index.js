//index.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const answerRoutes = require('./routes/answerRoutes');
const folderRoutes = require('./routes/folder');
const authRoutes = require('./routes/authRoutes');

const app = express(); // ✅ must come before any app.use()

// Middleware
app.use(cors({
  origin: ['https://quiz-app-frontend-kappa.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());

// Default root route
app.get('/', (req, res) => {
  res.send('Quiz App Backend is running');
});

// Routes
app.use('/api/folders', folderRoutes);
app.use('/auth', authRoutes);
app.use('/quiz', require('./routes/quizQuestion'));
app.use('/quiz', require('./routes/quiz'));
app.use('/answers', answerRoutes);

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('Error: MONGODB_URI is not defined.');
  process.exit(1);
}

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

// Catch-all for unhandled routes
app.use((req, res) => {
  console.warn(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Internal server error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Log environment variables (for debugging)
console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('SECRET_KEY:', process.env.SECRET_KEY);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
