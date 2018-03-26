'use strict'

const controller = require('lib/wiring/controller')
const models = require('app/models')
const Survey = models.survey
const Question = models.question

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

const index = (req, res, next) => {
  console.log('Question is ', Question)
  Survey.find()
    .populate('questions')
    .then(surveys => res.json({
      surveys: surveys.map((e) =>
        e.toJSON({ virtuals: true, user: req.user }))
    }))
    .then((blah) => console.log('blah is ', blah))
    .catch(next)
}

const show = (req, res) => {
  // console.log(req)
  Survey.findById(req.survey._id)
  .populate('questions')
  .then((survey) => {
    console.log('survey is', survey)
    console.log('req.survey is', req.survey)
    return survey
  })
  .then(survey => res.json({
    survey: survey.toJSON({ virtuals: true, user: req.user }) // using req.survey
  }))
    .catch(console.error)
}

const create = (req, res, next) => {
  const survey = Object.assign(req.body.survey, {
    _owner: req.user._id
  })
  Survey.create(survey)
    .then(survey =>
      res.status(201)
        .json({
          survey: survey.toJSON({ virtuals: true, user: req.user })
        }))
    .catch(next)
}

const update = (req, res, next) => {
  delete req.body.survey._owner  // disallow owner reassignment.

  req.survey.update(req.body.survey)
    .then(() => res.sendStatus(204))
    .catch(next)
}

const destroy = (req, res, next) => {
  req.survey.remove()
    .then(() => res.sendStatus(204))
    .catch(next)
}

module.exports = controller({
  index,
  show,
  create,
  update,
  destroy
}, { before: [
  { method: setUser, only: ['index', 'show'] },
  { method: authenticate, except: ['index', 'show'] },
  { method: setModel(Survey), only: ['show'] },
  { method: setModel(Survey, { forUser: true }), only: ['update', 'destroy'] }
] })
