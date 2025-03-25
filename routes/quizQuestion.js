const express = require("express");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const router = express.Router();
const QuizQuestion = require("../models/quizQuestion");
const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require("../middlewares/authMiddleware.js");

const handleError = (res, error, message = "Internal server error") => {
  console.error(message, error);
  res.status(500).json({ message });
};

const questionSchema = Joi.object({
  questionText: Joi.string().required(),
  questionType: Joi.string().valid('multiple-choice', 'open-ended').required(),
  timeLimit: Joi.number().integer().min(1).required(), // Expecting timeLimit in seconds from frontend
  optionA: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().optional().allow('')
  }),
  optionB: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().optional().allow('')
  }),
  optionC: Joi.string().optional().allow(''),
  optionD: Joi.string().optional().allow(''),
  optionE: Joi.string().optional().allow(''),
  optionF: Joi.string().optional().allow(''),
  correctAnswer: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.array().items(Joi.string().valid("A", "B", "C", "D", "E", "F")).min(1).required(),
    otherwise: Joi.array().optional()
  }),
  scorePerQuestion: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.number().optional()
  }),
  bonusScore: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.number().integer().min(0).required(),
    otherwise: Joi.number().optional()
  }),
  bonusTimeLimit: Joi.when('questionType', {
    is: 'multiple-choice',
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.number().optional()

  }),

}).options({ stripUnknown: true }); // Add this line

router.get("/:quizId/questions", checkAuth, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const questions = await QuizQuestion.find({ quiz: quizId });
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const results = await QuizResult.find({ quizPin: quiz.quizPin });

    res.json({
      questions,
      results,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch quiz questions.");
  }
});

router.delete("/:quizId/questions/:id/delete", checkAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    await QuizQuestion.findByIdAndRemove(questionId);
    res.json({ message: "Question deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete question.");
  }
});

router.get("/questions/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const quiz = await Quiz.findOne({ quizPin });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found for the given pin." });
    }

    const questions = await QuizQuestion.find({ quiz: quiz._id });

    res.json({
      questions,
      quiz,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch questions by quiz pin.");
  }
});

router.post("/getTimeLimit/:quizPin", async (req, res) => {
  try {
    const quizPin = req.params.quizPin;
    const questions = await QuizQuestion.find({ quizPin });

    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found for this quiz pin." });
    }

    res.json(questions[0].timeLimit);
  } catch (error) {
    handleError(res, error, "Failed to fetch time limit.");
  }
});

router.post("/:quizId/questions/add", checkAuth, async (req, res) => {
  const { error } = questionSchema.validate(req.body);
  if (error) {
    console.log("Validation Error:", error.details);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const payload = {
      ...req.body,
      quiz: req.params.quizId,
      createdBy: req.userData.userId,
      timeLimit: req.body.timeLimit // Expecting timeLimit in seconds from frontend
    };

    // Clear unnecessary fields for open-ended
    if (req.body.questionType === 'open-ended') {
      payload.optionC = '';
      payload.optionD = '';
      payload.optionE = '';
      payload.optionF = '';
      payload.correctAnswer = [];
      payload.scorePerQuestion = 0;
      payload.bonusScore = 0;
      payload.bonusTimeLimit = 0;
    }

    const newQuestion = new QuizQuestion(payload);
    const savedQuestion = await newQuestion.save();

    // Update parent quiz
    await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { $push: { questions: savedQuestion._id } }
    );

    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Failed to add question" });
  }
});

// routes/quizQuestion.js
router.put("/:quizId/questions/edit/:id", checkAuth, async (req, res) => {
  const { error } = questionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const questionId = req.params.id;
    const updateData = {
      ...req.body,
      timeLimit: req.body.timeLimit // Expecting timeLimit in seconds from frontend
    };

    // Remove restricted fields
    delete updateData.quiz;
    delete updateData.createdBy;
    delete updateData.__v;

    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(
      questionId,
      updateData,
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found." });
    }

    res.json(updatedQuestion);
  } catch (error) {
    handleError(res, error, "Failed to update the question.");
  }
});


router.get("/results/:quizPin", async (req, res) => {
  const { quizPin } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const results = await QuizResult.find({ quizPin })
      .sort({ result: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await QuizResult.countDocuments({ quizPin });

    res.json({
      results,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch filtered results.");
  }
});

module.exports = router;