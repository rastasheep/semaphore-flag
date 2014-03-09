# Cakefile

fs     = require 'fs'
{exec} = require 'child_process'
util   = require 'util'

task 'switchman:deploy', 'Deploy switchman app to Heroku', ->
  exec "git subtree push --prefix scripts/switchman heroku master", (err, stdout, stderr) ->
    handleError(err) if err
    util.log 'stdout: ' + stdout


handleError = (error) ->
  util.log error
  displayNotification error

displayNotification = (message = '') ->
  util.log message