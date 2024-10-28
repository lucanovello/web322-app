/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name:                   Luca Novello
Student ID:             038515003
Date:                   10-28-2024
Vercel Web App URL:     https://web322app-lucanovello.vercel.app/
GitHub Repository URL:  https://github.com/lucanovello/web322-app
********************************************************************************/
const path = require("path");
const express = require("express");
const storeService = require("./store-service.js");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

require("dotenv").config();

cloudinary.config({
  cloud_name: "db7hupoyf",
  api_key: "525735259498182",
  api_secret: "i2Ey-eThtffKbqc2qVp47EyfU3U",
  secure: true,
});

const upload = multer(); // no { storage: storage } since we are not using disk storage
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/views"));

// ROUTES
// Home routes
app.get("/", (req, res) => {
  res.redirect("/about");
});

// About routes
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

// Shop routes
app.get("/shop", (req, res) => {
  storeService
    .getPublishedItems()
    .then((pubItems) => res.json(pubItems))
    .catch((err) => {
      console.error(err);
      res.json({ message: err });
    });
});

// Items routes
app.get("/items", (req, res) => {
  if (req.query.category) {
    storeService
      .getItemsByCategory(req.query.category)
      .then((items) => res.json(items))
      .catch((err) => {
        console.error(err);
        res.json({ message: err });
      });
  } else if (req.query.minDate) {
    storeService
      .getItemsByMinDate(req.query.minDate)
      .then((items) => res.json(items))
      .catch((err) => {
        console.error(err);
        res.json({ message: err });
      });
  } else {
    storeService
      .getAllItems()
      .then((items) => res.json(items))
      .catch((err) => {
        console.error(err);
        res.json({ message: err });
      });
  }
});

app.get("/items/add", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/addItem.html"));
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    async function upload(req) {
      let result = await streamUpload(req);
      return result;
    }
    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }
  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    // TODO: Process the req.body and add it as a new Item before redirecting to /items
    storeService
      .addItem(req.body)
      .then((item) => {
        res.redirect("/items");
      })
      .catch((err) => {
        console.error(err);
        res.json({ message: err });
      });
  }
});

app.get("/items/:id", (req, res) => {
  storeService
    .getItemById(req.params.id)
    .then((item) => res.json(item))
    .catch((err) => {
      console.error(err);
      res.json({ message: err });
    });
});

// Categories routes
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) => res.json(categories))
    .catch((err) => {
      console.error(err);
      res.json({ message: err });
    });
});

// 404 route
app.use((req, res) => {
  res.status(404).sendFile(__dirname + "/views/404_page.html");
});

// Initialize the store service
storeService
  .initialize()
  .then(() => {
    //Listen on port 8080
    app.listen(HTTP_PORT, () =>
      console.log(
        `"Express http server listening on port: \u001b[1;3;4;92mhttp://localhost:${HTTP_PORT}\u001b[0m`
      )
    );
  })
  .catch((err) => {
    // Log the error
    console.error("ERROR: Initialization Failure:", err);
    // Exit the process
    process.exit(1);
  });
