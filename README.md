# authserver

Node server to manage and authenticate client certificates in Redis.

As of 15 March 2015, I have just copied and edited some files from <a href="https://github.com/evanx/cryptoserver">cryptoserver</a> but work has not commenced on this project in earnest. Hopefully I'll have a spare weekend in April in which to implement this somewhat simple server.

See this app's entry point: <a href="https://github.com/evanx/cryptoserver/blob/master/lib/app_cryptoserver.js">lib/app_authserver.js</a>.

This side project is developed as an exercise in Node crypto. As such, do not use it in production without thorough testing and review.


### testing 

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


