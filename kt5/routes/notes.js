const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// GET /notes - получить все заметки
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    if (notes.length === 0) {
      return res.status(404).json({ message: 'No notes found' });
    }
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /note/:id - получить заметку по id
router.get('/note/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /note/read/:title - получить заметку по названию
router.get('/note/read/:title', async (req, res) => {
  try {
    const note = await Note.findOne({ title: req.params.title });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /note/ - создать заметку
router.post('/note/', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Проверяем, существует ли заметка с таким же title
    const existingNote = await Note.findOne({ title });
    if (existingNote) {
      return res.status(409).json({ message: 'Note with this title already exists' });
    }

    const now = new Date();
    const note = new Note({
      title,
      content,
      created: now,
      changed: now
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Note with this title already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /note/:id - удалить заметку по id
router.delete('/note/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(409).json({ message: 'Note not found' });
    }
    await Note.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(409).json({ message: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /note/:id - обновить заметку по id
router.put('/note/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(409).json({ message: 'Note not found' });
    }

    // Если изменяется title, проверяем на дубликаты
    if (title && title !== note.title) {
      const existingNote = await Note.findOne({ title });
      if (existingNote) {
        return res.status(409).json({ message: 'Note with this title already exists' });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    updateData.changed = new Date();

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(409).json({ message: 'Note not found' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Note with this title already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

