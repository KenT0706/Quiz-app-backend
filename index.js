if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const answerRoutes = require('./routes/answerRoutes');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://quiz-app-frontend-kappa.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Default root route
app.get('/', (req, res) => {
  res.send('Quiz App Backend is running');
});

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

// Routes
const authRoutes = require('./routes/authRoutes'); // Path must match exactly
app.use('/auth', require('./routes/authRoutes'));
app.use('/quiz', require('./routes/quizQuestion'));
app.use('/quiz', require('./routes/quiz'));
app.use('/answers', answerRoutes);

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

// Log environment variables (for debugging purposes)
console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('SECRET_KEY:', process.env.SECRET_KEY);

// Add this before routes registration to debug endpoints
console.log('Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  }
});

// Start server
const port = process.env.PORT || 3000; // Use Vercel's default PORT environment variable
app.listen(port, () => console.log(`Server running on port ${port}`));