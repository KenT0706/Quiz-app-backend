const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  quizPin: String,
  name: String,
  result: Number,
  avatarId: String,
}, {timestamps:true});

module.exports = mongoose.model('QuizResult', QuizResultSchema);
