//routes/answerRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Answer = require('../models/answer');
const QuizQuestion = require('../models/quizQuestion');

router.post('/submit', async (req, res) => {
  try {
    const { quizPin, questionId, answerText, userName } = req.body; // Add userName
    
    console.log('Received answer submission with userName:', userName);
    
    if (!quizPin || isNaN(quizPin)) {
      console.error('Invalid quiz pin:', quizPin);
      return res.status(400).json({ message: 'Valid quiz pin required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      console.error('Invalid question ID:', questionId);
      return res.status(400).json({ message: 'Invalid question ID format' });
    }

    if (!answerText || typeof answerText !== 'string') {
      console.error('Invalid answer text:', answerText);
      return res.status(400).json({ message: 'Valid answer text required' });
    }

    const questionExists = await QuizQuestion.exists({ _id: questionId });
    if (!questionExists) {
      console.error('Question not found:', questionId);
      return res.status(404).json({ message: 'Question not found' });
    }

    const newAnswer = new Answer({
      quizPin: Number(quizPin),
      questionId: new mongoose.Types.ObjectId(questionId),
      answerText,
      userName: userName || 'Anonymous' // Save the userName
    });
    
    const savedAnswer = await newAnswer.save();
    console.log('Answer saved with userName:', savedAnswer.userName);
    
    res.status(201).json(savedAnswer);
  } catch (error) {
    console.error('Submission Error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error submitting answer',
      error: error.message
    });
  }
});

// Update the get endpoint to include userName
router.get('/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const answers = await Answer.find({
      questionId: new mongoose.Types.ObjectId(questionId)
    }).populate('userId', 'username');
    
    console.log('Found answers with user info:', answers);
    
    res.status(200).json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ message: 'Error fetching answers' });
  }
});

// Delete all answers for a specific question
router.delete('/question/:questionId/delete', async (req, res) => {
  const { questionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: 'Invalid question ID format' });
  }
  try {
    const result = await Answer.deleteMany({ questionId: questionId });
    res.json({ message: `${result.deletedCount} answers deleted for question ${questionId}` });
  } catch (error) {
    console.error('Error deleting answers by question ID:', error);
    res.status(500).json({ message: 'Error deleting answers for this question' });
  }
});

// Delete a single answer by ID
router.delete('/:answerId/delete', async (req, res) => {
  const { answerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: 'Invalid answer ID format' });
  }
  try {
    const deletedAnswer = await Answer.findByIdAndDelete(answerId);
    if (!deletedAnswer) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ message: 'Error deleting this answer' });
  }
});

module.exports = router;