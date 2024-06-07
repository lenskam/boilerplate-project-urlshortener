require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// models
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
});

// For FCC testing
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Update
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Error handler
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to create short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const urlRegex = /^(http|https):\/\/[^ "]+$/;

  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(new URL(originalUrl).hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = Math.floor(Math.random() * 100000).toString();
    const newUrl = new URL({
      original_url: originalUrl,
      short_url: shortUrl
    });

    newUrl.save((err, data) => {
      if (err) return console.error(err);
      res.json({
        original_url: data.original_url,
        short_url: data.short_url
      });
    });
  });
});


// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;

  URL.findOne({ short_url: shortUrl }, (err, data) => {
    if (err || !data) {
      return res.json({ error: 'No short URL found for the given input' });
    }

    res.redirect(data.original_url);
  });
});



const listener = app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
