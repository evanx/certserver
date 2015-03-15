#!/bin/bash

# enviroment

export APP_PORT=8443
export SERVER_KEY=tmp/certs/server.key
export SERVER_CERT=tmp/certs/server.cert
export CA_CERT=tmp/certs/ca.cert
export ENV_TYPE=test

user=client
certName=testcert

# util methods

c2get() {
  uri=$1
  user=$2
  echo "GET $uri as $user"
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert 
  echo " (exitCode $?)"
}

c1get() {
  c2get $1 client
}

c3post() {
  uri=$1
  user=$2
  data=$3
  echo "POST $uri as $user with data '$data'"
  curl -s -k https://localhost:8443/$uri -d "$data" --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  echo " (exitCode $?)"
}

c1post() {
  data="$1"
  c3post auth/$certName client "$data"
}

c0post() {
  c3post auth/$certName client ""
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
  echo; echo '$' redis-cli hkeys "cert:$certName"
  redis-cli hkeys "cert:$certName"
  echo; 
}

c0clear() {
  redis-cli del "cert:$certName"
}

# client 

c0client() {
  c1post cert/$certName 
  c1post auth/$certName  
}

c0clientTask() {
  out=tmp/client.out
  sleep 1
  c0client > $out
  sleep 1
  echo; echo "## client output"
  cat $out 
  sleep 2
  #c0redisShow
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




