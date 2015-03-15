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


# redis 

The following Redis CLI commands show the data saved in Redis. 

```shell
$ redis-cli hgetall cert:client0
1) "publicKey"
2) "CD6E72D5789677754E1DA09A4837E0F51C6B662E696D41B00B72F627C39D4F33951CC7C67379D2745C7D6D46DF8DB266BFCAF0BF82207103590E33A8FBA6F1B02AFB05A05E58AF567F53CB59C85E0A48BC8D950B026318D03DEFBB58AA5417BAF86F0BA27443A5596CA48E973E4B1F95DD5C410D53EC4D333AF6D1FCB058F54B95361159FA3FC7FAF2907D70B0974AE80BFC05238693C69F02BFB2E78C0FAF6C04F882BAB17ECF254180D1E38291176A4103EE9B5417263365B6292C0EEB69C9F4803955AA048787A4BF7650CD8854EB75B35CA0BB297A655D0A74B9F026393A70F490BF3FDDF000852FA1EC373EEDDC0A28FFE35D5D3A50664F066974E4254B"
3) "cert"
4) "{\"version\":0,\"subject\":{\"commonName\":\"client0\",\"organizationName\":\"ngena.com\"},\"issuer\":{\"commonName\":\"ca\",\"organizationName\":\"ngena.com\"},\"serial\":\"B2A704722FD42FDE\",\"notBefore\":\"2015-03-15T15:22:08.000Z\",\"notAfter\":\"2016-03-14T15:22:08.000Z\",\"signatureAlgorithm\":\"sha256WithRSAEncryption\",\"fingerPrint\":\"3D:51:7F:9E:60:72:51:20:5B:56:F8:43:9A:A8:EF:95:12:1B:B2:0F\",\"publicKey\":{\"algorithm\":\"rsaEncryption\",\"e\":\"65537\",\"n\":\"CD6E72D5789677754E1DA09A4837E0F51C6B662E696D41B00B72F627C39D4F33951CC7C67379D2745C7D6D46DF8DB266BFCAF0BF82207103590E33A8FBA6F1B02AFB05A05E58AF567F53CB59C85E0A48BC8D950B026318D03DEFBB58AA5417BAF86F0BA27443A5596CA48E973E4B1F95DD5C410D53EC4D333AF6D1FCB058F54B95361159FA3FC7FAF2907D70B0974AE80BFC05238693C69F02BFB2E78C0FAF6C04F882BAB17ECF254180D1E38291176A4103EE9B5417263365B6292C0EEB69C9F4803955AA048787A4BF7650CD8854EB75B35CA0BB297A655D0A74B9F026393A70F490BF3FDDF000852FA1EC373EEDDC0A28FFE35D5D3A50664F066974E4254B\"},\"altNames\":[],\"extensions\":{}}"
5) "pem"
6) "-----BEGIN CERTIFICATE-----\nMIICwzCCAasCCQCypwRyL9Qv3jANBgkqhkiG9w0BAQsFADAhMQswCQYDVQQDDAJj\nYTESMBAGA1UECgwJbmdlbmEuY29tMB4XDTE1MDMxNTE1MjIwOFoXDTE2MDMxNDE1\nMjIwOFowJjEQMA4GA1UEAwwHY2xpZW50MDESMBAGA1UECgwJbmdlbmEuY29tMIIB\nIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzW5y1XiWd3VOHaCaSDfg9Rxr\nZi5pbUGwC3L2J8OdTzOVHMfGc3nSdFx9bUbfjbJmv8rwv4IgcQNZDjOo+6bxsCr7\nBaBeWK9Wf1PLWcheCki8jZULAmMY0D3vu1iqVBe6+G8LonRDpVlspI6XPksfld1c\nQQ1T7E0zOvbR/LBY9UuVNhFZ+j/H+vKQfXCwl0roC/wFI4aTxp8Cv7LnjA+vbAT4\ngrqxfs8lQYDR44KRF2pBA+6bVBcmM2W2KSwO62nJ9IA5VaoEh4ekv3ZQzYhU63Wz\nXKC7KXplXQp0ufAmOTpw9JC/P93wAIUvoew3Pu3cCij/411dOlBmTwZpdOQlSwID\nAQABMA0GCSqGSIb3DQEBCwUAA4IBAQA03dPxtV/HJZvTP4j83AexUL+D3ytDFr4T\n4uWPWuadAgN6vQX1AM+hWB/giZt+8w3/dOhHP9tggLGvJ8aUQ95Xs53Cf7Vtzrs3\n0fFOrIL5NqxnBrMevME3Srh8PoaAyVC/0H9T+IwQD2IHDiqsdFodnP3poLqhGxEv\nRyjicFJ/WGYFYHY9cHRmzoCVP/BxJPxvrrb8fsR4iK3nxX9Eudh42E2BDJKn1eps\n1P//U0nLo9pn+qDMWA9MtLH7F0xTB2whG+pmyGJG3l5ZfUMl/EAP0FlM+cB9Xgiy\nNgyXgQ8Qn+Q8k/QS+jrA7EL0oI+AQDijT4fwf+S1xme5TDkQbPe9\n-----END CERTIFICATE-----\n"
```


## Other resources

See the companion project: https://github.com/evanx/cryptoserver

Wiki home: https://github.com/evanx/vellum/wiki


