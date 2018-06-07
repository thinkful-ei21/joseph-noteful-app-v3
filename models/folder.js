'use strict';

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true}
});

folderSchema.set('timestampes', true);

folderSchema.set('toObject', {
  virtuals: true,
  versionkey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Folder', folderSchema);