const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Answer = require('../models/answer');

// Add proper validation and error handling
router.post('/submit', async (req, res) => {
  try {
    const { quizPin, questionId, answerText } = req.body;

    // Validation
    if (!quizPin || !questionId || !answerText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate questionId format
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID format' });
    }

    const newAnswer = new Answer({
      quizPin,
      questionId: new mongoose.Types.ObjectId(questionId), // Ensure proper type
      answerText
    });

    await newAnswer.save();
    res.status(201).json(newAnswer); // Return created answer for verification
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ 
      message: 'Error submitting answer',
      error: error.message // Include error details
    });
  }
});



// Fetch answers for a specific question
router.get('/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;

    // Validate if questionId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const answers = await Answer.find({ questionId: questionId })
      .populate('userId', 'username');
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching answers' });
  }
});

module.exports = router;