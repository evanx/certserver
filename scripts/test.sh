#!/bin/bash

# enviroment

export APP_PORT=8443
export SERVER_KEY=tmp/certs/server.key
export SERVER_CERT=tmp/certs/server.cert
export CA_CERT=tmp/certs/ca.cert
export ENV_TYPE=test

user=app
certName=client0

# util functions

c2get() {
  uri=$1
  user=$2
  echo "GET $uri as $user"
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert 
  echo " (exitCode $?)"
}

c3post() {
  uri=$1
  certName=$2
  user=$3
  certFile=tmp/certs/$certName.cert 
  openssl x509 -text -in $certFile | grep 'Issuer:\|Subject:'
  echo "POST $uri as $user with cert '$certName'"
  cat $certFile | curl -s -k https://localhost:8443/$uri --data-binary @- --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  echo " (exitCode $?)"
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
  echo; echo '$' redis-cli redis hget cert:$certName $hkey 
  redis-cli hget cert:$certName $hkey
}

c0redisShow() {
  echo '$' redis-cli keys 'cert:*'
  redis-cli keys 'cert:*'
  redisKey="cert:$certName"
  echo; echo '$' redis-cli hkeys $redisKey
  redis-cli hkeys $redisKey
  echo; echo '$' redis-cli hgetall $redisKey
  redis-cli hgetall $redisKey
  echo; 
}

c0clear() {
  redis-cli del "cert:$certName"
}

# client 

c0client() {
  c2post cert/$certName $certName
  c2post auth/$certName $certName
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




