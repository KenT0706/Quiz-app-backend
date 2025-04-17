const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  quizPin: Number, // Changed from String to Number
  name: String,
  result: Number,
  avatarId: Number, // Changed from String to Number
}, {timestamps:true});

module.exports = mongoose.model('QuizResult', QuizResultSchema);
