// routes/folder.js
const express = require("express");
const router = express.Router();
const Folder = require("../models/folder");
const Quiz = require("../models/quiz");
const checkAuth = require("../middlewares/authMiddleware");

// Get all folders for the logged-in user
router.get("/", checkAuth, async (req, res) => {
  try {
    const folders = await Folder.find({ createdBy: req.userData.userId }).populate('quizzes');
    res.json(folders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new folder
router.post("/", checkAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const newFolder = new Folder({
      name,
      createdBy: req.userData.userId
    });
    const savedFolder = await newFolder.save();
    res.status(201).json(savedFolder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create folder." });
  }
});

// Update a folder (rename)
router.put("/:id", checkAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const { name } = req.body;
    const updatedFolder = await Folder.findByIdAndUpdate(
      folderId,
      { name },
      { new: true }
    );
    if (!updatedFolder) {
      return res.status(404).json({ message: "Folder not found." });
    }
    res.json(updatedFolder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update folder." });
  }
});

// Delete a folder
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    // Remove the folder reference from all quizzes in this folder
    await Quiz.updateMany(
      { folder: folderId },
      { $unset: { folder: 1 } }
    );
    await Folder.findByIdAndRemove(folderId);
    res.json({ message: "Folder deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete folder." });
  }
});

// Move a quiz to a folder
router.put("/:folderId/move-quiz", checkAuth, async (req, res) => {
  try {
    const { quizId } = req.body;
    const folderId = req.params.folderId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    // Check if the folder exists and belongs to the user
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, createdBy: req.userData.userId });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
      }
    }

    // Update the quiz's folder
    quiz.folder = folderId || null;
    await quiz.save();

    res.json({ message: "Quiz moved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to move quiz." });
  }
});

module.exports = router;