#!/bin/bash

# enviroment

export APP_PORT=8443
export SERVER_KEY=tmp/certs/server.key
export SERVER_CERT=tmp/certs/server.cert
export CA_CERT=tmp/certs/ca.cert
export ENV_TYPE=test

user=app
certName0=client0

# util functions

c2getq() {
  uri=$1
  user=$2
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert 
}

c2get() {
  uri=$1
  user=$2
  echo; echo "GET $uri" 
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert 
  echo 
  if [ $? -ne 0 ] 
  then
    echo "  (exitCode $?)" 
  fi
}

c3post() {
  uri=$1
  certName=$2
  user=$3
  certFile=tmp/certs/$certName.cert 
  openssl x509 -text -in $certFile | grep 'Issuer:\|Subject:'
  echo; echo "POST $uri"
  cat $certFile | curl -s -k https://localhost:8443/$uri --data-binary @- --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  echo 
  if [ $? -ne 0 ] 
  then
    echo "  (exitCode $?)" 
  fi
}

# default util functions 

c1get() {
  c2get $1 app
}

c2post() {
  c3post $1 $2 app
}

# redis 

c1hget() {
  hkey=$1
  echo; echo '$' redis-cli redis hget cert:$certName0 $hkey 
  redis-cli hget cert:$certName0 $hkey
}

c0redisShow() {
  echo '$' redis-cli keys 'cert:*'
  redis-cli keys 'cert:*'
  redisKey="cert:$certName0"
  echo; echo '$' redis-cli hkeys $redisKey
  redis-cli hkeys $redisKey
  echo; echo '$' redis-cli hgetall $redisKey
  redis-cli hgetall $redisKey
  echo; echo '$' redis-cli smembers cert:set
  redis-cli smembers cert:set
  echo; 
}

c0clear() {
  redis-cli del "cert:client0"
  redis-cli del "cert:client1"
}

# client 

c0client() {
  c2post cert/client0 client0
  c2post cert/client1 client1
  c2post auth/client0 client0
  c2post auth/client0 client1
  c2post auth/client1 client1
  c2post auth/client2 client1
  c1get fingerprint/client0
  fingerprint=`c2getq fingerprint/client0 app`
  echo "fingerprint $fingerprint"
  c1get auth/client0/$fingerprint
  c1get auth/client0/$fingerprint/aaaa
  c1get auth/client0/aaaa
  c2get revoke/client0 client0
  c1get auth/client0/$fingerprint
}

c0clientTask() {
  out=tmp/client.out
  sleep 1
  c0client > $out
  sleep 1
  echo; echo "## client output"
  cat $out 
  c0redisShow
}

# lifecycle 

c0kill() {
  fuser -k 8443/tcp
}

c0default() {
  c0kill
  c0clear
  c0clientTask & 
    nodejs lib/app_authserver.js | bunyan -o short
}

if [ $# -gt 0 ]
then
  command=$1
  shift
  c$#$command $@
else
  c0default
fi




