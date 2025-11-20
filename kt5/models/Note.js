const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  changed: {
    type: Date,
    default: Date.now
  }
});

// Обновляем поле changed перед сохранением
noteSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.changed = new Date();
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);

