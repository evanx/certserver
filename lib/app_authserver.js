
var fs = require('fs');
var async = require('async');
var lodash = require('lodash');
var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser')
var concat = require('concat-stream');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "authserver"});
var marked = require('marked');
var crypto = require('crypto');

var cryptoFunctions = require('./cryptoFunctions');
var commonFunctions = require('./commonFunctions');
var appFunctions = require('./appFunctions');

var redis = require('redis');

global.authserver = exports;

exports.isProduction = (process.env.ENV_TYPE.toLowerCase().indexOf('prod') === 0);
exports.log = log;
exports.redisClient = redis.createClient();

exports.redisClient.on('error', function (err) {
   log.error('error', err);
});

function handleError(res, error) {
   log.error('error', error);
   if (error instanceof Error) {
      log.error('error stack', error.stack);
   }
   res.status(500).send(error);
}

function handleAuth(req, res) {
   try {
      var cn = req.params.cn;
      var user = req.peerCN;
      log.info('receive', user, keyName);
      var datum = req.body;
      var responseData = {
         cn: cn,
         reqUrl: req.url
      };
      throw {message: 'unimplemented: ' + req.url};
   } catch (error) {
      handleError(res, error);
   }
}

function handlePost(req, res) {
   try {
      var cn = req.params.cn;
      var user = req.peerCN;
      log.info('receive', user, keyName);
      var datum = req.body;
      var responseData = {
         cn: cn,
         reqUrl: req.url
      };
      throw new Error('not implemented');
   } catch (error) {
      handleError(res, error);
   }
}

function handleHelp(req, res) {
   try {
      res.set('Content-Type', "text/html");
      fs.readFile('README.md', function (err, content) {
         if (content) {
            res.send(marked(content.toString()));
         } else {
            res.send('no help');
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function appLogger(req, res, next) {
   log.info('app', req.url);
   next();
}

function authorise(req, res, next) {
   log.info('authorise', req.url, req.peerCN);
   if (req.url === '/help') {
      next();
   } else if (!req.peerCN) {
      throw {message: 'not authorized'};
   } else {
      next();
   }
}

function authenticate(req, res, next) {
   if (!res.socket.authorized) {
      if (req.url === '/help') {
         next();
      } else {
         res.redirect('/help');
      }
   } else {
      var cert = req.socket.getPeerCertificate();
      req.peerCN = cert.subject.CN;
      log.info('authenticate', req.url, cert.subject.CN, cert.issuer);
      next();
   }
}

function dechunk(req, res, next) {
   req.pipe(concat(function (content) {
      req.body = content;
      next();
   }));
}

function monitor() {
   log.debug('monitor');
}

function start(env) {
   exports.monitorIntervalSeconds = 60;
   if (env.MONITOR_INTERVAL_SECONDS) {
      exports.monitorIntervalSeconds = parseInt(env.MONITOR_INTERVAL_SECONDS);
   }
   var options = {
      ca: fs.readFileSync(env.CA_CERT),
      key: fs.readFileSync(env.SERVER_KEY),
      cert: fs.readFileSync(env.SERVER_CERT),
      requestCert: true
   };
   app.use(appLogger);
   app.use(authenticate);
   app.use(authorise);
   app.get('/help', handleHelp);
   app.get('/auth/:cn', handleAuth);
   app.use(dechunk);
   app.post('/cert/:cn', handlePost);
   https.createServer(options, app).listen(env.APP_PORT);
   log.info('start', env.APP_PORT, env.ENV_TYPE);
   setInterval(monitor, exports.monitorIntervalSeconds * 1000);
}

exports.envNames = [
   'CA_CERT',
   'SERVER_CERT',
   'SERVER_KEY',
   'ENV_TYPE',
   'APP_PORT'
];

function validateEnv(env) {
   exports.envNames.forEach(function (envName) {
      var value = process.env[envName];
      if (!value) {
         throw new Error("missing env: " + envName);
      }
      log.info('env', envName, value);
   });
}

validateEnv(process.env);
start(process.env);

