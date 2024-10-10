/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name:                   Luca Novello
Student ID:             038515003
Date:                   10-08-2024
Vercel Web App URL:     https://web322app-lucanovello.vercel.app/
GitHub Repository URL:  https://github.com/lucanovello/web322-app
********************************************************************************/
const path = require("path");
const express = require("express");
const storeService = require("./store-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/views"));

// ROUTES
// Home route
app.get("/", (req, res) => {
  res.redirect("/about");
});

// About route
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

// Shop route
app.get("/shop", (req, res) => {
  storeService
    .getPublishedItems()
    .then((pubItems) => res.json(pubItems))
    .catch((err) => {
      console.error(err);
      res.json({ message: err });
    });
});

// Items route
app.get("/items", (req, res) => {
  storeService
    .getAllItems()
    .then((items) => res.json(items))
    .catch((err) => {
      console.error(err);
      res.json({ message: err });
    });
});

// Categories route
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
