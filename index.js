// require the necessary packages
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

// configure the twitter client with keys and tokens
const Twitter = require("twitter");
const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// text analysis configuration
const AYLIENTextAPI = require('aylien_textapi');
const textapi = new AYLIENTextAPI({
  application_id: process.env.AYLIEN_APP_ID,
  application_key: process.env.AYLIEN_API_KEY
});

// other configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());


app.get("/api/:user", (req, res) => {

  // request twitter for user's tweets
  const params = {
    screen_name: req.params.user
  }; // parameters for the request
  client.get('statuses/user_timeline', params, (error, tweets, response) => {
    if (error) return console.log(error)

    let polarityObj = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    for (let i = 0; i < tweets.length; ++i) {
      let tweet = tweets[i].text;

      // analyse tweet and put the result in the polarity object
      textapi.sentiment({
        'text': tweet
      }, function (error, response) {
        if (error === null) {
          ++polarityObj[response.polarity];
          let sum = polarityObj.positive + polarityObj.negative + polarityObj.neutral;
          if (sum === tweets.length) res.json(polarityObj);
        }

      });
    }

  });
});

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});