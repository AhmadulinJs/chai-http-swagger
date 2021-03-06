# Chai-HTTP-Swagger

> A Chai plugin for generating Swagger documentation from Chai HTTP testcases

The library provides [Chai](http://chaijs.com/) assertions for responses from http requests made using [Chai-HTTP](https://www.chaijs.com/plugins/chai-http/) and documents your api. This library automatically generates [Swagger/OpenAPI](https://swagger.io/docs/specification/about/) documentation and schemas.

---

## Installation

```
npm install chai-http-swagger
```

---

# Summary

- [Chai-HTTP-Swagger](#chai-http-swagger)
  - [Installation](#installation)
- [Summary](#summary)
  - [Usage](#usage)
  - [Send Request Body](#send-request-body)
    - [application/json](#json)
    - [multipart/form-data](#formdata)
      - [Upload File](#upload-file)
  - [Secured APIs](#secured-apis)
- [Demo](#demo)

---

## Usage

```javascript
// app.js
const express = require("express");
const { setup } = require("chai-http-swagger");
const app = express();
const options = {
  swagger: {
    // ... Your swagger configurations
  },
  config: {
    swaggerPath: __dirname, // your .yamlfiles directory
    fileName: "test", // your custom fileName for generated .yaml files
  },
};
const chaiHttpSwaggerSetup = setup(options);

app.use("/swagger", chaiHttpSwaggerSetup.swagger);

app.get("/status", (req, res) => {
  res.sendStatus(200);
  res.json({
    msg: "HELLO WORLD",
  });
});

app.listen(3000);
// ... etc
```

---

```javascript
// test.js
const chai = require("chai");
const chaiHttpSwagger = require("chai-http-swagger");
const app = require("./app");

chai.use(chaiHttpSwagger.httpClient);

it("should check status", (done) => {
  chai
    .request({
      app, // your express application
      method: "get", // request method
      path: "/status",
    })
    .end((err, res) => {
      res.should.have.status(200);
      res.should.be.a("Object");
      // your asserts
      done();
    });
});
```

Run your tests and generate `.yaml` files for Swagger

---

## Send Request Body
---

You can send body application/json or multipart/form-data content types

---

## JSON

Send json data to api

```javascript
it("should create new data", (done) => {
  const data = {
    msg: "Hello World",
  };
  chai
    .request({
      app,
      method: "post",
      path: "/data",
      body: {
        json: data, // this is automatically set Content-Type: application/json
      },
    })
    // .send(data)
    .end((err, res) => {
      res.should.have.status(200);
      res.should.be.a("Object");
      targetUser = res.body;
      done();
    });
});
```

## FormData

Send form-data to api

```javascript
it("should create new data", (done) => {
  const data = {
    msg: "Hello World",
  };
  chai
    .request({
      app,
      method: "post",
      path: "/data",
      body: {
        formData: data, // this is automatically set Content-Type: multipart/form-data
      },
    })
    // .send(data)
    .end((err, res) => {
      res.should.have.status(200);
      res.should.be.a("Object");
      targetUser = res.body;
      done();
    });
});
```

## Upload file

```javascript
it("should create new data", (done) => {
  const data = {
    msg: "Hello World",
  };
  chai
    .request({
      app,
      method: "post",
      path: "/data",
      body: {
        formData: {
          ...data,
          attachments: {
            // files
            imgFile: [`/img.png`, "img.png"],
          },
        }, // this is automatically set Content-Type: multipart/form-data
      },
    })
    // .send(data)
    .end((err, res) => {
      res.should.have.status(200);
      res.should.be.a("Object");
      targetUser = res.body;
      done();
    });
});
```
You can send file to server in the `attachments`

---

## Secured apis

Add Security schema to your `swagger` config

```javascript
const options = {
  swagger: {
    swaggerDefinition: {
      openapi: "3.0.0",
      components: {
        securitySchemes: {
          Bearer: {
            type: "apiKey",
            name: "Authorization", // api security key name
            in: "header",
            description: "Please use login api to get accessToken",
          },
        },
      },
    },
  },
  config: {},
};
```

After configuring Swagger, add security property in your request

```javascript
it("should get private message", (done) => {
  chai
    .request({
      app,
      method: "get",
      path: "/private",
      security: {
        Authorization: "token", // your token data
      },
    })
    .end((err, res) => {
      res.should.have.status(200);
      res.should.be.a("Object");
      res.body.should.be.a("Object");
      res.body.msg.should.be.equal("PRIVATE_MESSAGE");
      done();
    });
});
```

If you want more examples, see [this](https://github.com/AhmadulinJs/chai-http-swagger-examples/blob/main/src/test/testSecureApis.test.js)

---

## Demo

[Demo](https://github.com/AhmadulinJs/chai-http-swagger-examples)

---

Happy Coding!
