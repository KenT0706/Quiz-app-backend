const express = require("express");
const mongoose = require("mongoose"); // Add this line
const router = express.Router();

const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require("../middlewares/authMiddleware");
const QuizQuestion = require("../models/quizQuestion"); // Consistent naming

// Get all quizzes created by the logged-in user
router.get("/", checkAuth, async (req, res) => {
  try {
    const questions = await Quiz.find({ createdBy: req.userData.userId });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a quiz
router.delete("/:id/delete", checkAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    await Quiz.findByIdAndRemove(quizId);
    res.json({ message: "Quiz deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get quizzes by quiz pin
router.get("/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const questions = await Quiz.find({ quizPin });
    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found for this quiz pin." });
    }
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a new quiz
router.post("/add", checkAuth, async (req, res) => {
  try {
    const { scenario, title } = req.body;
    const newQuiz = new Quiz({
      scenario,
      title,
      createdBy: req.userData.userId, // From checkAuth middleware
    });
    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add the quiz." });
  }
});

router.post("/:quizId/saveResult", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const newResult = new QuizResult({
      quizPin: quiz.quizPin, // Use the quiz's actual PIN
      name: req.body.name,
      result: req.body.currentScore,
      avatarId: req.body.avtId,
    });
    
    await newResult.save();
    res.json({ message: "Result saved successfully.", newResult });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Failed to save the result." });
  }
});

router.post("/:quizId/submit", async (req, res) => {
  try {
    const { answers } = req.body;
    const quizId = req.params.quizId;

    // Validate quizId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    // Validate answers
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an array." });
    }

    // Fetch all questions for this quiz
    const questions = await quizQuestion.find({ quiz: quizId }).exec();

    // Create a lookup map for faster access by questionId
    const questionMap = {};
    questions.forEach(question => {
      questionMap[question._id.toString()] = question;
    });

    let score = 0;

    // Calculate score based on answers
    answers.forEach(answerObj => {
      const { questionId, answerText, answerTime } = answerObj;
      const question = questionMap[questionId];
      if (!question) return; // Skip if question not found

      if (question.questionType === 'multiple-choice') {
        // Use answerText directly as the selected letter
        const selectedLetter = answerText.toUpperCase();
        if (question.correctAnswer.includes(selectedLetter)) {
          score += question.scorePerQuestion;
          // Add bonus if answered quickly enough
          if (answerTime <= question.bonusTimeLimit) {
            score += question.bonusScore;
          }
        }
      }
      // Open-ended questions don't contribute to score
    });

    res.json({ score });
  } catch (error) {
    console.error("Error calculating score:", error);
    res.status(500).json({ message: "Failed to calculate the score." });
  }
});

// Edit a quiz
router.put("/edit/:id", checkAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { quizPin, scenario, title } = req.body;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { quizPin, scenario, title },
      { new: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    res.json(updatedQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update the quiz." });
  }
});

// Get results by quiz pin
router.get("/results/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const results = await QuizResult.find({ quizPin }).sort({ result: -1 });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch results." });
  }
});

router.delete('/:quizId/results/delete', async (req, res) => {
  const { quizId } = req.params;
  try {
    // 1. Find the quiz to get its PIN
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // 2. Delete results using the quiz's PIN
    const result = await QuizResult.deleteMany({ quizPin: quiz.quizPin });
    
    res.json({ message: `${result.deletedCount} attempts deleted` });
  } catch (error) {
    console.error('Error deleting quiz results:', error);
    res.status(500).json({ message: 'Error deleting attempt history' });
  }
});

router.post("/:id/duplicate", checkAuth, async (req, res) => {
  try {
    const originalQuiz = await Quiz.findById(req.params.id)
      .populate('questions')
      .exec();

    if (!originalQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Create new quiz with "Copy" suffix
    const newQuiz = new Quiz({
      title: `${originalQuiz.title} (Copy)`,
      scenario: originalQuiz.scenario,
      createdBy: req.userData.userId,
      questionType: originalQuiz.questionType,
      timeLimit: originalQuiz.timeLimit
    });

    // Save to generate new quizPin
    await newQuiz.save();

    // Duplicate all questions
    const questionPromises = originalQuiz.questions.map(async (question) => {
      const newQuestion = new QuizQuestion({
        ...question.toObject(),
        _id: undefined, // Generate new ID
        quiz: newQuiz._id,
        createdBy: req.userData.userId
      });
      await newQuestion.save();
      return newQuestion._id;
    });

    // Update new quiz with duplicated questions
    newQuiz.questions = await Promise.all(questionPromises);
    await newQuiz.save();

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error("Duplication error:", error);
    res.status(500).json({ message: "Failed to duplicate quiz" });
  }
});

module.exports = router;