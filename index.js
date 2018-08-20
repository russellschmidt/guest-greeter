'use strict'

const http = require('http');

exports.handler = function(event, context) {

  try {
    var request = event.request;
    var session = event.session;

    if (!event.session.attributes) {
      event.session.attributes = {};
    }
  
    if (request.type === 'LaunchRequest') {
      handleLaunchIntent(context);
  
    } else if (request.type === 'IntentRequest') {
      if (request.intent.name === 'HelloIntent') {
        handleHelloIntent(request, context)
      } else if (request.intent.name === 'QuoteIntent') {
        handleQuoteIntent(request, context, session);
      } else if (request.intent.name === 'NextQuoteIntent') {
        handleNextQuoteIntent(request, context, session);
      } else if (request.intent.name === 'AMAZON.StopIntent' || request.intent.name === 'AMAZON.CancelIntent') {
        context.succeed(buildResponse({
          speechText: "Good bye. ",
          endSession: true
        }));
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

function handleLaunchIntent (context) {
  let options = {};
  options.speechText = "Welcome to Uncle Rusty's Greeting Skill. Using this skill you can greet your guests and amaze them. For example, you can say, say hello to John. ";
  options.repromptText = "Whom do you care to greet? You can say, for example, say hello to John. ";
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleHelloIntent (request, context) {
  let options = {};
  let name = request.intent.slots.FirstName.value;
  options.speechText = "Hello " + name + ". ";
  options.speechText += "I think your name is spelled <say-as interpret-as='spell-out'>" + name + "</say-as>. ";
  options.speechText += getWish();
  options.cardTitle = `Hello, ${name}.`;

  getQuote(function(quote, err) {
    if (err) {
      context.fail(err);
    } else {
      options.speechText += quote;
      options.cardContent = quote;
      options.imageUrl = "https://cdn.pixabay.com/photo/2018/04/28/19/53/cartoon-3358118_960_720.png";
      options.endSession = true;

      context.succeed(buildResponse(options));
    }
  })
}

function handleQuoteIntent(request, context, session) {
  let options = {};
  options.session = session;
    
  getQuote(function(quote, err) {
    if (err) {
      context.fail(err);
    } else {
      options.speechText = quote;
      options.speechText += " Do you want to listen to one more quote? ";
      options.repromptText = " You can say yes or one more. ";
      options.session.attributes.quoteIntent = true;
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  })
}

function handleNextQuoteIntent(request, context, session) {
  let options = {};
  options.session = session;

  if (session.attributes.quoteIntent) {
    getQuote(function(quote, err) {
      if (err) {
        context.fail(err);
      } else {
        options.speechText = quote;
        options.speechText += " Do you want to listen to one more quote? ";
        options.repromptText = " You can say yes or one more. ";
        options.session.attributes.quoteIntent = true;
        options.endSession = true;
        context.succeed(buildResponse(options));
      }
    })
  } else {
    options.speechText = " Wrong invocation of this intent. ";
    options.endSession = true;
    context.succeed(buildResponse(options));
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

  if (options.cardTitle) {
    response.response.card = {
      type: "Simple",
      title: options.cardTitle
    }

    if (options.imageUrl) {
      response.response.card.type = 'Standard';
      response.response.card.text = options.cardContent;
      response.response.card.image = {
        smallImageUrl: options.imageUrl,
        largeImageUrl: options.imageUrl
      };
    } else { 
      response.response.card.content = options.cardContent;
    }
  }

  if (options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }

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