'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Folder = require('../models/folder');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  Folder.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });

});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const {id} = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The "id" is not valid');
    err.status = 404;
    return next(err);
  }

  Folder.findById(id)
    .then(result => {
      if (result) {
        res.json(result).status(200);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const {name} = req.body;

  if (!name) {
    const err = new Error('Missing "name" in request body');
    err.status = 400;
    return next(err);
  }

  const newFolder = {name};

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists!');
        err.status = 400;
      }
      next(err);
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const {id} = req.params;
  const {name} = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The "id" is not valid');
    err.status = 400;
    return next(err);
  }

  if (!name) {
    const err = new Error('Missing "name" in request body');
    err.status = 400;
    return next(err);
  }

  const updateFolder = {name};

  Folder.findByIdAndUpdate(id, updateFolder, {new: true})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists!');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('The "id" is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findByIdAndRemove(id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;