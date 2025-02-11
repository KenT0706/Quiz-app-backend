const express = require("express");
const router = express.Router();

const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require("../middlewares/authMiddleware");
const quizQuestion = require("../models/quizQuestion");

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

// Save quiz result
router.post("/:quizId/saveResult", async (req, res) => {
  try {
    const { currentScore, name, quizPin, avtId } = req.body;
    const newResult = new QuizResult({
      quizPin,
      name,
      result: currentScore,
      avatarId: avtId,
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
    const { answers, answerTimes } = req.body; // answerTimes is an array of times in seconds
    const quizId = req.params.quizId;
    console.log("Received answers:", answers);
    console.log("Received answerTimes:", answerTimes);

    // Validate input
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be provided as an array." });
    }
    if (!answerTimes || !Array.isArray(answerTimes) || answerTimes.length !== answers.length) {
      return res.status(400).json({ message: "Answer times must be provided as an array with the same length as answers." });
    }

    const questions = await quizQuestion.find({ quiz: quizId }).exec();
    console.log("Questions from DB:", questions);
    let score = 0;

    questions.forEach((question, index) => {
      if (question.correctAnswer.includes(answers[index])) {
        score += question.scorePerQuestion;

        // Calculate bonus score based on answer time
        if (answerTimes[index] <= question.bonusTimeLimit) {
          const timeDifference = question.bonusTimeLimit - answerTimes[index];
          const bonusDeduction = Math.floor(timeDifference / 5); // Deduct 1 point for every 5 seconds
          const finalBonusScore = Math.max(0, question.bonusScore - bonusDeduction);
          score += finalBonusScore;
        }
      }
    });
    console.log("Final calculated score:", score);
    res.json({ score });
  } catch (error) {
    console.error(error);
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

module.exports = router;