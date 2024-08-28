const express = require("express");
const jwt = require('jsonwebtoken');

const router = express.Router();
const QuizQuestion = require("../models/quizQuestion");
const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require('../middlewares/auth.js');

router.get("/:quizId/questions", checkAuth, async (req, res) => {
  const quizId = req.params.quizId;
  try {
    const questions = await QuizQuestion.find({ quiz: quizId });
    const quiz = await Quiz.find({ _id: quizId });
    const results = await QuizResult.find({ quizPin: quiz[0].quizPin });

    res.json({
      'questions': questions,
      'results': results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:quizId/questions/:id/delete", checkAuth, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Find the question by ID and remove it
    await QuizQuestion.findByIdAndRemove(questionId);

    res.json({ message: "Question deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/questions/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const quiz = await Quiz.find({ quizPin: quizPin });
    const questions = await QuizQuestion.find({ quiz: quiz[0]._id });


    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this quiz pin." });
    }

    res.json({
      'questions': questions,
      'quiz': quiz[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/getTimeLimit/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const questions = await QuizQuestion.find({ quizPin });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this quiz pin." });
    }

    res.json(questions[0].timeLimit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to add a new quiz question
router.post("/:quizId/questions/add", checkAuth, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  const quizId = req.params.quizId;
  console.log(quizId);
  try {
    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      optionF,
      correctAnswer,
      timeLimit
    } = req.body;

    // Create a new quiz question
    const newQuestion = new QuizQuestion({
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      optionF,
      correctAnswer,
      timeLimit,
      quiz: quizId,
      createdBy: decodedToken.userId
    });

    // Save the question to the database
    const savedQuestion = await newQuestion.save();

    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add the question." });
  }
});

router.post("/saveResult", async (req, res) => {
  const resultToCheck = req.body.currentScore;
  const nameToCheck = req.body.name;
  const quizPinToCheck = req.body.quizPin;
  const avtId = req.body.avtId;
  console.log(req.body.avtId);

  try {
    // Find a document with the specified quizPin and name
    const existingResult = await QuizResult.findOne({
      quizPin: quizPinToCheck,
      name: nameToCheck
    });

    if (existingResult) {
      // A document with the same quizPin and name already exists
      // You can check if the result is different and update it if needed
      if (existingResult.result !== resultToCheck) {
        existingResult.result = resultToCheck;
        existingResult.avatarId = avtId;
        await existingResult.save();
        console.log("Result updated.");
        res.json({ existingResult });
      } else {
        console.log("Result is the same, no update needed.");
      }
    } else {
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
    }
  } catch (err) {
    console.error("Error:", err);
  }
})



// Route to edit an existing quiz question
router.put("/:quizId/questions/edit/:id", async (req, res) => {
  try {
    const questionId = req.params.id;
    const {
      quizPin,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      optionF,
      correctAnswer
    } = req.body;

    // Find the question by ID and update it
    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(
      questionId,
      {
        quizPin,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        optionF,
        correctAnswer
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found." });
    }

    res.json(updatedQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update the question." });
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
