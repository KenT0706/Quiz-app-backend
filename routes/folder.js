// routes/folder.js
const express = require("express");
const router = express.Router();
const Folder = require("../models/folder");
const Quiz = require("../models/quiz");
const checkAuth = require("../middlewares/authMiddleware");

// routes/folder.js - Update GET endpoint
router.get("/", checkAuth, async (req, res) => {
  try {
    console.log("Fetching folders for user:", req.userData.userId);
    
    const folders = await Folder.find({ 
      createdBy: req.userData.userId 
    }).populate('quizzes');
    
    console.log("Found folders:", folders.length);
    res.json(folders);
  } catch (error) {
    console.error("Folder fetch error:", error);
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

// routes/folder.js - Fix delete folder route
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    console.log("Deleting folder:", folderId);
    
    // Find all quizzes in this folder FIRST
    const quizzesInFolder = await Quiz.find({ folder: folderId });
    console.log(`Found ${quizzesInFolder.length} quizzes in folder`);
    
    // Set folder to null on all quizzes in this folder
    await Quiz.updateMany(
      { folder: folderId },
      { $set: { folder: null } }  // CHANGE THIS LINE
    );
    
    // Now delete the folder
    await Folder.findByIdAndDelete(folderId);
    
    console.log("Folder deleted successfully");
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
    const userId = req.userData.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    // Remove quiz from previous folder's quizzes array
    if (quiz.folder) {
      await Folder.findByIdAndUpdate(
        quiz.folder,
        { $pull: { quizzes: quizId } }
      );
    }

    // If moving to a new folder
    if (folderId) {
      // Check if folder exists and belongs to user
      const folder = await Folder.findOne({ 
        _id: folderId, 
        createdBy: userId 
      });
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
      }

      // Update quiz's folder reference
      quiz.folder = folderId;
      await quiz.save();

      // Add quiz to new folder's quizzes array
      await Folder.findByIdAndUpdate(
        folderId,
        { $addToSet: { quizzes: quizId } }
      );
    } else {
      // Moving to "No Folder"
      quiz.folder = null;
      await quiz.save();
    }

    res.json({ message: "Quiz moved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to move quiz." });
  }
});

router.post("/fix-data", checkAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    console.log("Fixing data for user:", userId);
    
    // Get all folders for this user
    const folders = await Folder.find({ createdBy: userId });
    console.log(`Found ${folders.length} folders`);
    
    // For each folder, sync quizzes
    for (const folder of folders) {
      console.log(`\nProcessing folder: ${folder.name} (${folder._id})`);
      
      // Find all quizzes that should be in this folder
      const quizzesInFolder = await Quiz.find({ 
        createdBy: userId,
        folder: folder._id 
      });
      
      console.log(`Quizzes with folder field set: ${quizzesInFolder.length}`);
      console.log(`Folder's quizzes array length: ${folder.quizzes.length}`);
      
      // Update folder's quizzes array to match
      const quizIds = quizzesInFolder.map(q => q._id);
      await Folder.findByIdAndUpdate(
        folder._id,
        { $set: { quizzes: quizIds } }
      );
      
      console.log(`Updated folder ${folder.name} with ${quizIds.length} quizzes`);
    }
    
    res.json({ message: "Data fixed successfully" });
  } catch (error) {
    console.error("Data fix error:", error);
    res.status(500).json({ message: "Failed to fix data" });
  }
});

module.exports = router;