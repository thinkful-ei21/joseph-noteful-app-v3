'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI }  = require('../config');

const Tag = require('../models/tag');

const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Tags', () => {

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Tag.insertMany(seedTags);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {

    it('should return the correct number of tags with the "name" field', function() {
      return Promise.all([
        Tag.find().sort('name'),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function(item, i) {
            expect(item).to.be.an('object');
            expect(item).to.include.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

  });

  describe('GET /api/tags/:id', function() {

    it('should return correct tag', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.a.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function() {
      return chai.request(app)
        .get('/api/tags/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The "id" is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function() {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/tags/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/tags', function() {

    it('should create and return a new item when provided valid data', function() {
      const newItem = {
        'name': 'newTag'
      };
      let res;
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "name" field', function() {
      const newItem = {
        'name': null
      };
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing "name" in request body');
        });
    });

  });

  describe('PUT /api/tags/:id', function() {

    it('should update the tag when provided valid data', function() {
      const updateItem = { 'name': 'domesticated' };
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateItem);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateItem.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when "id" is not valid', function() {
      const updateItem = {
        'name': 'domesticated'
      };
      return chai.request(app)
        .put('/api/tags/NOT-A-VALID-ID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The "id" is not valid');
        });
    });

    it('should respond with a 404 for an "id" that does not exist', function() {
      const updateItem = {
        'name': 'domesticated'
      };
      return chai.request(app)
        .put('/api/tags/DOESNOTEXIST')
        .send(updateItem)
        .then(res =>{
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function() {
      const updateItem = {
        'name': null
      };
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;

          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateItem);     
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing "name" in request body');
        });
    });

  });

  describe('DELETE /api/tags/id', function() {

    it('should delete an existing document and respond with 204', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Tag.count({_id: data.id});
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });
    
  });

});