const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  quizPin: {
    type: Number,
    unique: true,
    required: true,
  },
  scenerio: String,
  title: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
});


// Pre-save middleware to handle auto-incrementing
quizSchema.pre('validate', async function (next) {
  const doc = this;
  // console.log(this);
  if (!doc.quizPin) {
    // Only increment if the field is not provided (new document)
    try {
      const nextValue = await getNextSequenceValue('Quiz', 'quizPin', 100000);
      doc.quizPin = nextValue;
      next();
    } catch (error) {
      next(err);
    }

  } else {
    // For existing documents, proceed without incrementing
    next();
  }
});

function getNextSequenceValue(modelName, fieldName, startValue) {
  return new Promise((resolve, reject) => {
    // Find the highest existing value in the collection
    mongoose.model(modelName).find().sort({ [fieldName]: -1 }).limit(1).exec()
      .then((doc) => {
        const nextValue = doc.length === 0 ? startValue : doc[0][fieldName] + 1;
        resolve(nextValue);
      })
      .catch((err) => {
        reject(err);
      });
  });
}


module.exports = mongoose.model('Quiz', quizSchema);
