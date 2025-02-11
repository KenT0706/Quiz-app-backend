const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionText: String,
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
  optionE: String,
  optionF: String,
  correctAnswer: [String],
  timeLimit: Number,
  scorePerQuestion: Number, // Ensure this field is present
  bonusScore: Number, // Ensure this field is present
  bonusTimeLimit: Number, // Ensure this field is present
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
