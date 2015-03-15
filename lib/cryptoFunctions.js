
var crypto = require('crypto');
var async = require('async');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver.cryptoFunctions", level: 'debug'});
var commonFunctions = require('./commonFunctions');

function create() {
   var that = {};
   var options = {
   };
   that.options = options;
   return that;
}

module.exports = create();

