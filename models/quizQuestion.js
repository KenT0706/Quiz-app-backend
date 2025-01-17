const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  timeLimit: String,
  questionText: String,
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
  optionE: String,
  optionF: String,
  correctAnswer: String,
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
