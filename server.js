/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name:                   Luca Novello
Student ID:             038515003
Date:                   10-08-2024
Cyclic Web App URL:     https://web322app-lucanovello.vercel.app/
GitHub Repository URL:  https://github.com/lucanovello/web322-app
********************************************************************************/
const path = require("path");
const express = require("express");
const storeService = require("./store-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "/views"));

// ROUTES
app.get("/", (req, res) => {
  console.log(req.url);
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  console.log(req.url);
  res.sendFile(path.join(process.cwd(), "/views/about.html"));
});

app.get("/shop", (req, res) => {
  console.log(req.url);
  storeService
    .getPublishedItems()
    .then((pubItems) => res.send(pubItems))
    .catch((err) => res.send(err));
});

app.get("/items", (req, res) => {
  console.log(req.url);
  storeService
    .getAllItems()
    .then((items) => res.send(items))
    .catch((err) => res.send(err));
});

app.get("/categories", (req, res) => {
  console.log(req.url);
  storeService
    .getCategories()
    .then((categories) => res.send(categories))
    .catch((err) => res.send(err));
});

app.use((req, res) => {
  console.log(req.url);
  res.status(404).sendFile(process.cwd() + "/views/404_page.html");
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
    console.error("ERROR: Initialization Failed:", err);
    process.exit(1);
  });
