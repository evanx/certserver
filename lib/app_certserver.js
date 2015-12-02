
var fs = require('fs');
var async = require('async');
var lodash = require('lodash');
var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser')
var concat = require('concat-stream');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "certserver", level: 'debug'});
var marked = require('marked');
var crypto = require('crypto');
var x509 = require('x509');

var cryptoFunctions = require('./cryptoFunctions');
var commonFunctions = require('./commonFunctions');
var appFunctions = require('./appFunctions');

var redis = require('redis');
var redisClient = redis.createClient();

exports.log = log;
exports.redisClient = redisClient;

global.certserver = exports;

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

function handlePostCert(req, res) {
   try {
      var certName = req.params.certName;
      var redisKey = 'cert:' + certName;
      var user = req.peerCN;
      var pem = req.body.toString('utf8');
      var cert = x509.parseCert(pem);
      var resData = {
         cn: cert.subject.commonName,
         fingerprint: cert.fingerPrint
      };
      log.info('handlePostCert', user, certName, resData);
      log.debug('cert', Object.keys(cert), cert);
      redisClient.exists(redisKey, function (err, exists) {
         if (err) {
            handleError(res, err);
         } else if (exists) {
            handleError(res, {message: 'already exists'});
         } else {
            var multi = redisClient.multi();
            multi.hset(redisKey, 'pem', pem);
            multi.hset(redisKey, 'cert', JSON.stringify(cert));
            multi.hset(redisKey, 'publicKey', cert.publicKey.n);
            multi.hset(redisKey, 'fingerprint', cert.fingerPrint);
            multi.exec(function (err) {
               if (err) {
                  handleError(res, err);
               } else {
                  res.json(resData);
               }
            });
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handlePostAuth(req, res) {
   try {
      var certName = req.params.certName;
      var redisKey = 'cert:' + certName;
      var user = req.peerCN;
      var pem = req.body.toString('utf8');
      var cert = x509.parseCert(pem);
      var resData = {
         cn: cert.subject.commonName,
         fingerprint: cert.fingerPrint
      };
      log.info('handlePostAuth', user, certName, resData);
      redisClient.sismember('cert:revoked', certName, function (err, ismember) {
         if (err) {
            handleError(res, err);
         } else if (ismember) {
            res.status(500).json({error: 'revoked'});
         } else {
            redisClient.hget(redisKey, 'publicKey', function (err, publicKeyReply) {
               if (err) {
                  handleError(res, err);
                  return;
               } else if (!publicKeyReply) {
                  res.status(500).json({error: 'not found'});
               } else if (cert.publicKey.n !== publicKeyReply) {
                  res.status(500).json({error: 'invalid public key'});
               } else {
                  res.json({message: 'public key matches'});
               }
            });
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetAuth(req, res) {
   try {
      var certName = req.params.certName;
      var fingerprint = req.params.fingerprint;
      var publicKey = req.params.publicKey;
      var redisKey = 'cert:' + certName;
      var user = req.peerCN;
      log.info('handleGetAuth', user, certName, fingerprint, publicKey);
      redisClient.sismember('cert:revoked', certName, function (err, ismember) {
         if (err) {
            handleError(res, err);
         } else if (ismember) {
            res.status(500).json({error: 'revoked'});
         } else {
            redisClient.hget(redisKey, 'fingerprint', function (err, fingerprintReply) {
               if (err) {
                  handleError(res, err);
               } else if (!fingerprintReply) {
                  res.status(500).json({error: 'not found'});
               } else if (fingerprintReply !== fingerprint) {
                  res.status(500).json({error: 'invalid fingerprint'});
               } else if (publicKey) {
                  redisClient.hget(redisKey, 'publicKey', function (err, publicKeyReply) {
                     if (err) {
                        handleError(res, err);
                     } else if (publicKeyReply !== publicKey) {
                        res.status(500).json({error: 'invalid public key'});
                     } else {
                        res.json({message: 'public key matches'});
                     }
                  });
               } else {
                  res.json({message: 'fingerprint matches'});
               }
            });
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetFingerprint(req, res) {
   try {
      var certName = req.params.certName;
      var redisKey = 'cert:' + certName;
      var user = req.peerCN;
      log.info('handleGetFingerprint', user, certName);
      redisClient.hget(redisKey, 'fingerprint', function (err, fingerprintReply) {
         if (err) {
            handleError(res, err);
         } else if (!fingerprintReply) {
            res.status(500).json({error: 'not found'});
         } else {
            res.send(fingerprintReply);
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleRevokeCert(req, res) {
   try {
      var certName = req.params.certName;
      var user = req.peerCN;
      log.info('handleRevokeCert', user, certName);
      redisClient.sadd('cert:revoked', certName, function (err) {
         if (err) {
            handleError(res, err);
         } else {
            res.send({message: 'added to revocation list'});
         }
      });
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
   exports.isProduction = (env.ENV_TYPE.toLowerCase().indexOf('prod') === 0);
   exports.monitorIntervalSeconds = 60;
   if (env.MONITOR_INTERVAL_SECONDS) {
      exports.monitorIntervalSeconds = parseInt(env.MONITOR_INTERVAL_SECONDS);
   }
   var options = {
      ca: fs.readFileSync(env.CA_CERT),
      key: fs.readFileSync(env.SERVER_KEY),
      cert: fs.readFileSync(env.SERVER_CERT),
      requestCert: true,
      redis: {
         host: env.REDIS_HOST,
         port: parseInt(env.REDIS_PORT)
      }
   };
   app.use(appLogger);
   app.use(authenticate);
   app.use(authorise);
   app.get('/help', handleHelp);
   app.use(dechunk);
   app.get('/auth/:certName/:fingerprint/:publicKey', handleGetAuth);
   app.get('/fingerprint/:certName', handleGetFingerprint);
   app.get('/auth/:certName/:fingerprint', handleGetAuth);
   app.post('/auth/:certName', handlePostAuth);
   app.post('/cert/:certName', handlePostCert);
   app.get('/revoke/:certName', handleRevokeCert);
   https.createServer(options, app).listen(env.APP_PORT);
   log.info('start', env.APP_PORT, env.ENV_TYPE);
   setInterval(monitor, exports.monitorIntervalSeconds * 1000);
}

exports.envNames = [
   'CA_CERT',
   'SERVER_CERT',
   'SERVER_KEY',
   'ENV_TYPE',
   'APP_PORT',
   'REDIS_HOST',
   'REDIS_PORT',
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

