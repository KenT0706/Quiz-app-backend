const mongoose = require('mongoose');
const Answer = require('../models/answer');

async function createIndexes() {
  await Answer.collection.createIndex({ quizPin: 1, questionId: 1 });
  console.log('Indexes created');
}

// Run with: node scripts/createIndexes.js