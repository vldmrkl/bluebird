// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const twit = require('twit');
const config = require('./config');

let twitter = new twit(config);
let responseToUser = '';
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function googleAssistantHandler(agent) {
    let conv = agent.conv(); // Get Actions on Google library conv instance
    conv.ask("Let's read some tweets!");
    twitter.get('statuses/home_timeline', { count: 10 }, (err, data, response) => {
        if(err){
            responseToUser="Something went wrong, I couldn't fetch tweets.";
            conv.ask(responseToUser);
        }
        else{
            console.log(data);
            data.forEach(tweet => {
                responseToUser = String("Tweet from " + tweet.user.name + ': ' + tweet.text);
                conv.ask(responseToUser);
            });
            responseToUser = "That's it!";
        }
      });
    conv.ask("Exit!");
    agent.add(conv); // Add Actions on Google library responses to your agent's response
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('readFeedIntent', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
