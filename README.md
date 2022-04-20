# Promptside Webhook Sample

This is a client for receiving webhook events from Promptside. It also demonstrates how to access the [Promptside REST APIs](https://promptside.io/developer).

It's built using Node, TypeScript, and Express.


### Build instructions

```
docker build -t promptside/webhook-sample .
```


### Run instructions

```
docker run -e PS_CLIENT_ID=<yourApiClientId> -e PS_CLIENT_SECRET=<yourSecret> -p 8080:8080 promptside/webhook-sample
```

The client handles HTTP POST requests at `/hook`

Once the client is running, you will need to set up HTTPS ingress (e.g. using a reverse proxy) to give your application a public URL. Then you can configure Promptside to send webhook events to that URL.

For example: `https://promptside-webhook-sample.yourdomain.com/hook`
