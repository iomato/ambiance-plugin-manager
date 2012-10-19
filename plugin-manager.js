/*jshint asi:true */
exports.name = 'pluin-manager'
exports.version = '0.0.1'
exports.author = 'Irakli Gozalishvili <rfobic@gmail.com>'
exports.description = 'Ambiance editor plugin manager'
exports.stability = 'unstable'

var fs = require('fs')
var path = require('path')
var HOME = path.join(process.env.HOME, ".ambiance")
var promise = require('micro-promise/core')
var npm = require('npm')
var npmConfig = { prefix: HOME }
var hub = require("plugin-hub/core"), meta = hub.meta, values = meta.values


function makeCommand(name) {
  return function() {
    var params = Array.prototype.slice.call(arguments)
    var deferred = promise.defer()
    npm.load(npmConfig, function(error, npm) {
      if (error) return deferred.reject(error)
      npm.commands[name](params, function(error, value) {
        if (error) deferred.reject(error)
        else deferred.resolve(value)
      })
    })
    return deferred.promise
  }
}

var npmList = makeCommand('list')
var npmSearch = makeCommand('search')
var npmInstall = makeCommand('install')

function isAmbiancePlugin(entry) {
  return entry.keywords &&
    entry.keywords.indexOf("plugin") >= 0 &&
    entry.keywords.indexOf("ambiance") >= 0
}

function search(term) {
  return npmSearch(term || "").then(function(entries) {
    Object.keys(entries).reduce(function(result, name) {
      var entry = entries[name]
      if (isAmbiancePlugin(entries)) result[name] = entry
      return result
    })
  })
}

exports.npm = npm
exports.list = npmList
exports.search = search
exports.install = npmInstall


exports.commands = {
  //plugin: {
    "plugins-search": meta({
      description: 'Searches installable plugins in npm',
      takes: [ 'string' ]
    }, function(term) {
      return npmSearch(term).then(function(entries) {
        return Object.keys(entries).forEach(function(result, name) {
          
        }, "")
      })
    }),
    "plugin-list": meta({
      description: 'Lists installed plugins'
    }, function list() {
      return npmList().then(function(result) {
        var plugins = result.dependencies
        return Object.keys(plugins).reduce(function(result, name) {
          var plugin = plugins[name]
          return result + "<div>" +
            "<h3><a target=_blank href=" + plugin.homepage + ">" +
                             plugin.name + "@" +
                             plugin.version + "</a></h3>" +
            "<em>" + plugin.description + "</em>"
        }, "")
      })
    }),
    "plugin-install": meta({
      description: 'Installes plugin from npm',
      takes: [ 'string' ]
    }, function(name) {
      console.log('>>>> ' +  name)
      return npmInstall(name).then(function(result) {
        console.log('<<<< ' +  name)
        return "<pre>" + JSON.stringify(result, 2, 2) + "</pre>"
      }, function(error) {
        console.error(error)
        return "<b class=error>" + error.message + "</b>"
      })
    })
  //}
}

exports.onstartup = function(env) {
  try { fs.mkdirSync(HOME) } catch(e) {}
  fs.readdir(path.join(HOME, "node_modules"), function(e, plugins) {
    plugins.forEach(function(name) {
      try {
        descriptor = require(path.join(HOME, "node_modules", name, "package"))
        console.log(descriptor)
      } catch (e) {
        console.log("failed to load plugin " + name)
      }
    })
  })
}
