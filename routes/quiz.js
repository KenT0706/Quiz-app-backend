//routes/quiz.js
const QuizQuestion = require("../models/quizQuestion"); // Consistent naming
const express = require("express");
const mongoose = require("mongoose"); // Add this line
const router = express.Router();
const Folder = require("../models/folder");

const Quiz = require("../models/quiz");
const QuizResult = require("../models/result");
const checkAuth = require("../middlewares/authMiddleware");


// Get all quizzes created by the logged-in user
router.get("/", checkAuth, async (req, res) => {
  try {
    console.log("Fetching quizzes for user:", req.userData.userId);
    
    // Use proper population with select
    const quizzes = await Quiz.find({ 
      createdBy: req.userData.userId 
    })
    .populate({
      path: 'folder',
      select: '_id name'  // Only get id and name
    })
    .lean();  // Convert to plain objects
    
    console.log(`Found ${quizzes.length} quizzes`);
    
    // Log each quiz's folder status
    quizzes.forEach((quiz, index) => {
      console.log(`Quiz ${index + 1}: ${quiz.title}`, {
        id: quiz._id,
        folderId: quiz.folder ? quiz.folder._id : 'null',
        folderName: quiz.folder ? quiz.folder.name : 'No folder'
      });
    });
    
    res.json(quizzes);
  } catch (error) {
    console.error("Quiz fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a quiz
router.delete("/:id/delete", checkAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    
    // First, find the quiz to get its folder
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    
    // If the quiz is in a folder, remove it from the folder's quizzes array
    if (quiz.folder) {
      await Folder.findByIdAndUpdate(
        quiz.folder,
        { $pull: { quizzes: quizId } }
      );
    }
    
    // Now delete the quiz
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

// routes/quiz.js - Update the add quiz route with more logging
router.post("/add", checkAuth, async (req, res) => {
  try {
    const { scenario, title, folder } = req.body;
    console.log("Creating quiz with data:", { scenario, title, folder });
    console.log("User ID:", req.userData.userId);
    
    const newQuiz = new Quiz({
      scenario,
      title,
      createdBy: req.userData.userId,
      folder: folder || null
    });
    
    console.log("New quiz object:", newQuiz);
    const savedQuiz = await newQuiz.save();
    console.log("Saved quiz:", savedQuiz);
    
    if (folder) {
      console.log("Adding quiz to folder:", folder);
      const updatedFolder = await Folder.findByIdAndUpdate(
        folder,
        { $addToSet: { quizzes: savedQuiz._id } },
        { new: true }
      );
      console.log("Updated folder:", updatedFolder);
    }
    
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error("Quiz creation error:", error);
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
    if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const answers = req.body.answers; // Get answers from request body

    const questions = await QuizQuestion.find({ quiz: req.params.quizId }).exec();
    const questionMap = {};
    questions.forEach(q => questionMap[q._id.toString()] = q);

    let score = 0;
    answers.forEach(answer => {
      const question = questionMap[answer.questionId];
      if (!question) return;

      if (question.questionType === 'multiple-choice') {
        const selected = answer.answerText.toUpperCase();
        if (question.correctAnswer.includes(selected)) {
          score += question.scorePerQuestion;
          if (answer.answerTime <= question.bonusTimeLimit) {
            score += question.bonusScore;
          }
        }
      }
    });

    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    res.json({ score });
  } catch (error) {
    console.error("Error calculating score:", error);
    res.status(500).json({ 
      message: "Failed to calculate score",
      error: error.message
    });
  }
});

// Edit a quiz
router.put("/edit/:id", checkAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { quizPin, scenario, title, folder } = req.body;

   const userId = req.userData.userId;

      // Find the quiz first to get current folder
    const oldQuiz = await Quiz.findById(quizId);
    if (!oldQuiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    
    // Check if folder changed
    const oldFolder = oldQuiz.folder;
    const newFolder = folder || null;
    
    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { title, scenario, folder: newFolder },
      { new: true }
    );
    
    // If folder changed, update both folders
    if (String(oldFolder) !== String(newFolder)) {
      // Remove from old folder if exists
      if (oldFolder) {
        await Folder.findByIdAndUpdate(
          oldFolder,
          { $pull: { quizzes: quizId } }
        );
      }
      
      // Add to new folder if exists
      if (newFolder) {
        await Folder.findByIdAndUpdate(
          newFolder,
          { $addToSet: { quizzes: quizId } }
        );
      }
    }

    res.json(updatedQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update the quiz." });
  }
});

// routes/quiz.js - Update results endpoint
router.get("/results/:quizPin", async (req, res) => {
  try {
    const quizPin = Number(req.params.quizPin); // Convert to Number
    const results = await QuizResult.find({ quizPin }).sort({ result: -1 });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch results." });
  }
});

// routes/answerRoutes.js - Update answers endpoint
router.get('/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const answers = await Answer.find({ 
      questionId: new mongoose.Types.ObjectId(questionId) // Convert to ObjectId
    }).populate('userId', 'username');
    
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching answers' });
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

// routes/quiz.js - Update the duplicate route
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
      timeLimit: originalQuiz.timeLimit,
      folder: originalQuiz.folder || null // Copy the folder reference
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
    
    // If the original quiz was in a folder, add the duplicate to the same folder
    if (originalQuiz.folder) {
      await Folder.findByIdAndUpdate(
        originalQuiz.folder,
        { $addToSet: { quizzes: newQuiz._id } }
      );
    }

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error("Duplication error:", error);
    res.status(500).json({ message: "Failed to duplicate quiz" });
  }
});

module.exports = router;