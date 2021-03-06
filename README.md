
## Certserver - a microservice to manage SSL certificates

<b>This is a Node.js microservice to enroll, revoke and verify certs, stored in Redis.</b>

See this app's entry point: <a href="https://github.com/evanx/certserver/blob/master/lib/app_certserver.js">lib/app_certserver.js</a>.

This side project is developed as an exercise in Node crypto. As such, do not use it in production without thorough testing and review.

See: http://redis.io/topics/security


### Bash test script

As per usual, `git clone` and `npm install` 

Run the following bash script to generate test certs using openssl: [scripts/certGen.sh](https://github.com/evanx/certserver/blob/master/scripts/certGen.sh)

Then run the test script: [scripts/test.sh](https://github.com/evanx/certserver/blob/master/scripts/test.sh)

The test script assumes that a local Redis server is running on its default port (6379).

```shell
sudo apt-get install redis-server
sudo service start redis-server

git clone https://github.com/evanx/certserver.git
cd certserver
npm install

sh scripts/certGen.sh
sh scripts/test.sh
```

When the app is running, you can view the URL <a href="https://localhost:8443/help">https://localhost:8443/help</a> in your browser. Actually this should just render this `README.md.` Incidently any request without a client cert, is redirected to `/help.` Since a self-signed server certificate is used, your browser will issue an "unsafe" warning.

```
~/certserver$ sh scripts/test.sh 

CA_CERT tmp/certs/ca.cert
SERVER_CERT tmp/certs/server.cert
SERVER_KEY tmp/certs/server.key
ENV_TYPE test
APP_PORT 8443
REDIS_HOST 127.0.0.1
REDIS_PORT 6379
...
```

#### Test requests

The test script uses `curl` to send client-authenticated HTTPS requests to the service, using the "app" certificate.
```
POST /cert/client0 data:tmp/certs/client0.cert
{"fingerprint":"98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59"}

POST /auth/client0 data:tmp/certs/client0.cert
{"message":"public key matches"}

POST /auth/client0 data:tmp/certs/client1.cert
{"error":"invalid public key"} 

GET /fingerprint/client0
98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59

GET /auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59
{"message":"fingerprint matches"}

GET /auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59/qwerty
{"error":"invalid public key"} 

GET /auth/client0/qwerty
{"error":"invalid fingerprint"}

GET /revoke/client0
{"message":"added to revocation list"}

GET /auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59
{"error":"revoked"}
```

where `client0` is the common name of a client certificate we want to enroll, and later verify when the client connects to our app, e.g. via a "dynamic truststore" e.g. see 
my <a href="https://github.com/evanx/vellum/wiki/ClientAuthentication">Client Authentication</a> Java article.


#### Redis data

The following Redis CLI command shows the data saved in Redis, where each cert has a hashset.

```shell
$ redis-cli hkeys cert:client0
1) "fingerprint"
2) "publicKey"
3) "cert"
4) "pem"
```

The following Redis CLI command shows our revocation list.

```shell
$ redis-cli smembers cert:revoked
1) "client0"
```


## Other resources

Another crypto project: https://github.com/evanx/cryptoserver

Wiki home: https://github.com/evanx/vellum/wiki


