const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionText: String,
  questionType: {
    type: String,
    enum: ['multiple-choice', 'open-ended'],
    default: 'multiple-choice'
  },
  optionA: String,
  optionB: String,
  optionC: { type: String, default: '' },
  optionD: { type: String, default: '' },
  optionE: { type: String, default: '' },
  optionF: { type: String, default: '' },
  correctAnswer: { type: [String], default: [] },
  scorePerQuestion: { type: Number, default: 0 },
  bonusScore: { type: Number, default: 0 },
  bonusTimeLimit: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 0 },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // Ensure this is correct
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);