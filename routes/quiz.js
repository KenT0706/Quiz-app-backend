const express = require("express");
const jwt = require('jsonwebtoken');

const router = express.Router();
const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require('../middlewares/auth.js');
const quizQuestion = require("../models/quizQuestion.js");

router.get("/", checkAuth, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  try {
    const questions = await Quiz.find({ createdBy: decodedToken.userId });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const quizId = req.params.id;

    // Find the question by ID and remove it
    await Quiz.findByIdAndRemove(quizId);

    res.json({ message: "Question deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const questions = await Quiz.find({ quizPin });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this quiz pin." });
    }

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to add a new quiz question
router.post("/add", async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

  try {
    const {
      scenerio,
      title
    } = req.body;

    // Create a new quiz question
    const newQuiz = new Quiz({
      scenerio,
      title,
      createdBy: decodedToken.userId
    });

    // Save the quiz to the database
    const savedQuiz = await newQuiz.save();

    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add the Quiz." });
  }
});

router.post("/:quizId/saveResult", async (req, res) => {
  const resultToCheck = req.body.currentScore;
  const nameToCheck = req.body.name;
  const quizPinToCheck = req.body.quizPin;
  const avtId = req.body.avtId;

  try {
    // Find a document with the specified quizPin and name
    // const existingResult = await QuizResult.findOne({
    //   quizPin: quizPinToCheck,
    //   name: nameToCheck
    // });

    // if (existingResult) {
    //   // A document with the same quizPin and name already exists
    //   // You can check if the result is different and update it if needed
    //   if (existingResult.result !== resultToCheck) {
    //     existingResult.result = resultToCheck;
    //     existingResult.avatarId = avtId;
    //     await existingResult.save();
    //     console.log("Result updated.");
    //     res.json({ existingResult });
    //   } else {
    //     console.log("Result is the same, no update needed.");
    //     res.json({ existingResult });
    //   }
    // } else {
      // No existing document found, create a new one
      const newResult = new QuizResult({
        quizPin: quizPinToCheck,
        name: nameToCheck,
        result: resultToCheck,
        avatarId: avtId
      });
      await newResult.save();
      console.log("New result created.");
      res.json({ newResult });
    // }
  } catch (err) {
    console.error("Error:", err);
  }
});

router.post("/:quizId/submit", async (req, res) => {
  const answers = req.body.answers;
  const quizId= req.params.quizId;
  const answerSpeed = req.body.answerSpeed;

  // Fetch questions based on the quizPin
  const questions = await quizQuestion.find({ quiz: quizId }).exec();
  let score = 0;
  questions.forEach((question, index) => {
    const correctAnswer = question.correctAnswer;
    const selectedAnswer = answers[index];
    if (correctAnswer === selectedAnswer) {
      score += 5;
      if (answerSpeed[index] === true) {
        score += 5;
      }
    }
  });

  res.json({ score });
});

// Route to edit an existing quiz question
router.put("/edit/:id", async (req, res) => {
  try {
    const quizId = req.params.id;
    const {
      quizPin,
      scenerio,
      title,
    } = req.body;

    // Find the question by ID and update it
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        quizPin,
        title, 
        scenerio
      },
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

router.get("/results/:quizPin", async (req, res) => {
  const quizPin = req.params.quizPin;
  try {
    const filteredResults = await QuizResult.find({ quizPin }).sort({ result: -1 }).exec();
    res.json(filteredResults);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching filtered results." });
  }
});

module.exports = router;
