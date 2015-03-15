
# certserver 

## Node server to enroll, revoke and verify certs 

Node server to manage and authenticate client certificates in Redis.

On 15 March 2015, work commenced on this project, but it is currently incomplete.

See this app's entry point: <a href="https://github.com/evanx/cryptoserver/blob/master/lib/app_cryptoserver.js">lib/app_authserver.js</a>.

This side project is developed as an exercise in Node crypto. As such, do not use it in production without thorough testing and review.


### Bash test script

First generate test certs using openssl: [scripts/certGen.sh](https://github.com/evanx/authserver/blob/master/scripts/certGen.sh)

Then run the test script: [scripts/test.sh](https://github.com/evanx/authserver/blob/master/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">https://localhost:8443/help</a> in your browser. Actually this should just render this `README.md.` Incidently any request without a client cert, is redirected to `/help.` Since a self-signed server certificate is used, your browser will issue an "unsafe" warning.

The test script uses `curl` to send client-authenticated HTTPS requests to the server.

```
POST cert/client0 
{"message":"public key matches"}

POST auth/client0
{"error":"invalid public key"} 

GET fingerprint/client0
98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59

GET auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59
{"message":"fingerprint matches"}

GET auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59/qwerty
{"error":"invalid public key"} 

GET auth/client0/qwerty
{"error":"invalid fingerprint"}

GET revoke/client0
{"message":"added to revocation list"}

GET auth/client0/98:BB:5C:7F:ED:A7:36:83:C4:6B:D7:8F:DD:74:B4:52:A0:0E:8A:59
{"error":"revoked"}
```

where the `app` is the client of our auth server, which wants to authenticate its SSL clients e.g. `client0.`


### Redis 

The following Redis CLI commands show the data saved in Redis. 

```shell
$ redis-cli hkeys cert:client0
1) "fingerPrint"
2) "publicKey"
3) "cert"
4) "pem"
```


## Other resources

See the companion project: https://github.com/evanx/cryptoserver

Wiki home: https://github.com/evanx/vellum/wiki


