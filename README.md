# authserver

Node server to manage and authenticate client certificates in Redis.

On 15 March 2015, work commenced on this project, but it is currently incomplete.

See this app's entry point: <a href="https://github.com/evanx/cryptoserver/blob/master/lib/app_cryptoserver.js">lib/app_authserver.js</a>.

This side project is developed as an exercise in Node crypto. As such, do not use it in production without thorough testing and review.


### Bash test script

First generate test certs using openssl: [scripts/certGen.sh](https://github.com/evanx/authserver/blob/master/scripts/certGen.sh)

Then run the test script: [scripts/test.sh](https://github.com/evanx/authserver/blob/master/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">https://localhost:8443/help</a> in your browser. Actually this should just render this `README.md.` Incidently any request without a client cert, is redirected to `/help.` Since a self-signed server certificate is used, your browser will issue an "unsafe" warning.

The test script uses `curl` to send client-authenticated HTTPS requests to the server.


### Redis 

The following Redis CLI commands show the data saved in Redis. 

```shell
$ redis-cli hkeys cert:client0
1) "publicKey"
2) "cert"
3) "pem"
```


## Other resources

See the companion project: https://github.com/evanx/cryptoserver

Wiki home: https://github.com/evanx/vellum/wiki


