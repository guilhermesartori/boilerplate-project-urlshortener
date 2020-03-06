"use strict";

const express = require("express"); // server handler
const mongo = require("mongodb"); // database
const mongoose = require("mongoose"); // database management
const cors = require("cors"); // for FCC tests
const bodyParser = require("body-parser"); // parse HTML forms from http POST methods
const dns = require("dns"); // verify URL validity
require("dotenv").config(); // enable .env file

// Basic Configuration
const app = express(); // server
const port = process.env.PORT; // port to listen
app.use(cors()); // for FCC tests

// Setting up the database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const shortenedUrlSchema = mongoose.Schema({
  originalUrl: { type: String, required: true }
});
const ShortenedUrl = mongoose.model("ShortenedUrl", shortenedUrlSchema);

// Basic middleware to serve the style file
app.use("/public", express.static(process.cwd() + "/public"));
app.use((req, res, next) => {
  next();
});

// Serve the HTML file
app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Get the URL. If valid, write it to the database and respond with the shortened version.
app.post(
  "/api/shorturl/new",
  bodyParser.urlencoded({ extended: false }),
  function(req, res) {
    let url = req.body.url;
    if (url.startsWith("https://")) {
      url = url.substr(8);
    } else if (url.startsWith("http://")) {
      url = url.substr(7);
    }
    dns.lookup(url, (err, address, family) => {
      if (err) {
        return res.json({ error: "Invalid URL." });
      }

      const shortUrl = new ShortenedUrl({ originalUrl: url });
      shortUrl.save((err, data) => {
        if (err) return res.json({ error: "Database error." });
        else
          return res.json({
            original_url: data.originalUrl,
            short_url: data._id
          });
      });
    });
  }
);

// Redirect to the original URL when requested for the shortened version
app.get("/api/shorturl/:id", function(req, res) {
  const shortUrl = ShortenedUrl.findById(req.params.id, (err, data) => {
    if (err) res.status(404).send("Not found.");
    res.redirect(data.originalUrl);
  });
});

// Listen on port
app.listen(port, function() {
  console.log("Node.js listening on port " + port + "...");
});
