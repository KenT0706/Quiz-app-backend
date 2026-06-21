const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Quiz = require('../models/quiz');
const checkAuth = require('../middlewares/authMiddleware');

// GET all folders for the logged-in user
router.get('/', checkAuth, async (req, res) => {
  try {
    const folders = await Folder.find({ createdBy: req.userData.userId });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Error fetching folders' });
  }
});

// POST create a new folder
router.post('/', checkAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    const newFolder = new Folder({
      name: name.trim(),
      createdBy: req.userData.userId
    });
    const savedFolder = await newFolder.save();
    res.status(201).json(savedFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Error creating folder' });
  }
});

// PUT update a folder's name
router.put('/:id', checkAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }
    const updatedFolder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!updatedFolder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ message: 'Error updating folder' });
  }
});

// DELETE a folder — quizzes inside get moved back to "No Folder"
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    await Quiz.updateMany({ folder: folderId }, { folder: null });

    const deletedFolder = await Folder.findByIdAndDelete(folderId);
    if (!deletedFolder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Error deleting folder' });
  }
});

// PUT move a quiz into (or out of) a folder
router.put('/:folderId/move-quiz', checkAuth, async (req, res) => {
  try {
    const { quizId } = req.body;
    const { folderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    // Treat a missing/invalid folderId as "remove from folder"
    const targetFolder = mongoose.Types.ObjectId.isValid(folderId) ? folderId : null;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { folder: targetFolder },
      { new: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(updatedQuiz);
  } catch (error) {
    console.error('Error moving quiz:', error);
    res.status(500).json({ message: 'Error moving quiz to folder' });
  }
});

module.exports = router;