'use strict'

const http = require('http');

exports.handler = function(event, context) {

  try {
    var request = event.request;
  
    if (request.type === 'LaunchRequest') {
      let options = {};
      options.speechText = "Welcome to Uncle Rusty's Greeting Skill. Using this skill you can greet your guests and amaze them. For example, you can say, say hello to John. ";
      options.repromptText = "Whom do you care to greet? You can say, for example, say hello to John. ";
      options.endSession = false;
      context.succeed(buildResponse(options));
  
    } else if (request.type === 'IntentRequest') {
      let options = {};
      if (request.intent.name === 'HelloIntent') {
        let name = request.intent.slots.FirstName.value;
        options.speechText = "Hello " + name + ". ";
        options.speechText += "I think your name is spelled <say-as interpret-as='spell-out'>" + name + "</say-as>. ";
        options.speechText += getWish();
        getQuote(function(quote, err) {
          if (err) {
            context.fail(err);
          } else {
            options.speechText += quote;
            options.endSession = true;
            context.succeed(buildResponse(options));
          }
        })

      } else {
        throw "Unknown intent";
  
      }
    } else if (request.type === 'SessionEndedRequest') {
  
    } else {
      throw "Unknown intent type";
    }
  } catch(e) {
    context.fail("Exception: " + e);
  }

}



function buildResponse (options) {
  var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        text: "<speak>" + options.speechText + "</speak>"
      },
      shouldEndSession: options.endSession
    }
  };

  if (options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "SSML",
        text: "<speak>" + options.repromptText + "</speak>"
      }
    }
  };

  return response;
}

function getWish() {
  var myDate = new Date();
  var hours = myDate.getUTCHours() - 8; // Pacific Time Zone
  if (hours < 12) {
    return "Good morning. ";
  } else if (hours < 18) {
    return "Good afternoon. ";
  } else {
    return "Good evening. ";
  }
}

function getQuote(callback) {
  var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req = http.get(url, function(res){
    var body = "";

    res.on('data', function(chunk) {
      body += chunk;
    })

    res.on('end', function(){
      body = body.replace(/\\/g, '');
      var quote = JSON.parse(body);
      callback(quote.quoteText);
    });
  });

  req.on('error', function(err) {
    callback('', err)
  })
}