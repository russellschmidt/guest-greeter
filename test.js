'use strict'

var expect = require('chai').expect,  

lambdaToTest = require('./index')


function Context() {
  this.speechResponse = null;
  this.speechError = null;

  this.succeed = function(rsp) {
    this.speechResponse = rsp;
    this.done();
  };

  this.fail = function(rsp) {
    this.speechError = rsp;
    this.done();
  };

}

function validRsp(ctx,options) {
     expect(ctx.speechError).to.be.null;
     expect(ctx.speechResponse.version).to.be.equal('1.0');
     expect(ctx.speechResponse.response).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech.type).to.be.equal('SSML');
     expect(ctx.speechResponse.response.outputSpeech.ssml).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/<speak>.*<\/speak>/);
     if(options.endSession) {
       expect(ctx.speechResponse.response.shouldEndSession).to.be.true;
       expect(ctx.speechResponse.response.reprompt).to.be.undefined;
     } else {
       expect(ctx.speechResponse.response.shouldEndSession).to.be.false;
       expect(ctx.speechResponse.response.reprompt.outputSpeech).to.be.not.undefined;
       expect(ctx.speechResponse.response.reprompt.outputSpeech.type).to.be.equal('SSML');
       expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/<speak>.*<\/speak>/);
     }

}

function validCard(ctx, standardCard) {
     expect(ctx.speechResponse.response.card).not.to.be.undefined;
     expect(ctx.speechResponse.response.card.title).not.to.be.undefined;
     if(standardCard) {
      expect(ctx.speechResponse.response.card.type).to.be.equal('Standard');
      expect(ctx.speechResponse.response.card.text).not.to.be.undefined;  
      expect(ctx.speechResponse.response.card.image).not.to.be.undefined;  
      expect(ctx.speechResponse.response.card.image.largeImageUrl).to.match(/^https:\/\//);
      expect(ctx.speechResponse.response.card.image.smallImageUrl).to.match(/^https:\/\//);
     } else {
      expect(ctx.speechResponse.response.card.type).to.be.equal('Simple');
      expect(ctx.speechResponse.response.card.content).not.to.be.undefined;
     }
}



var event = {
  session: {
    new: false,
    sessionId: 'session1234',
    attributes: {},
    user: {
      userId: 'usr123'
    },
    application: {
      applicationId: "amzn1.ask.skill.9132081b-4813-4273-8b77-1117a2d0b257"
    }
  },
  version: '1.0',
  request: {
    intent: {
      slots: {
        SlotName: {
          name: 'SlotName',
          value: 'slot value'
        }
      },
      name: 'intent name'
    },
    type: 'IntentRequest',
    requestId: 'request5678'
  }
};




describe('All intents', function() {
  var ctx = new Context();

  describe('Test LaunchIntent', function() {

      before(function(done) {
        event.request.type = 'LaunchRequest';
        event.request.intent = {};
        event.session.attributes = {};
        ctx.done = done;
        lambdaToTest.handler(event , ctx);
      });

     it('valid response', function() {
       validRsp(ctx,{
         endSession: false,
       });
     });

     // check for initial speech and reprompt - just check a unique start to see if its playing.
     //it('valid outputSpeech', function() {
     //  expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/<speak>Hi,.*<\/speak>/);
     //});
    
     //it('valid repromptSpeech', function() {
     //  expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/<speak>For example.*<\/speak>/);
     //});

    it('valid outputSpeech', function() {
      expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Welcome to Uncle/);
    });

    it('valid repromptSpeech', function() {
      expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/Whom do you care to greet/);
    });

  });
  // 
  describe(`Test HelloIntent`, function() {

    before(function(done) {
      event.request.intent = {};
      event.session.attributes = {};
      event.request.type = 'IntentRequest';
      event.request.intent.name = 'HelloIntent';
      event.request.intent.slots = {
        FirstName: {
          name: 'FirstName',
          value: 'John'
        }
      };
      ctx.done = done;
      lambdaToTest.handler(event , ctx);
    });

   it('valid response', function() {
     validRsp(ctx, {
       endSession: false
     });
   });

   it('valid outputSpeech', function() {
    expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Hello .*John/);
   });

  //  it('valid repromptSpeech', function() {
  //   expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/For example/);
  //  });

  });

    // 
    describe(`Test QuoteIntent`, function() {

      before(function(done) {
        event.request.intent = {};
        event.session.attributes = {};
        event.request.type = 'IntentRequest';
        event.request.intent.name = 'QuoteIntent';
        event.request.intent.slots = {};
        ctx.done = done;
        lambdaToTest.handler(event , ctx);
      });
  
     it('valid response', function() {
       validRsp(ctx, {
         endSession: false
       });
     });
  
     it('valid outputSpeech', function() {
      expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/one more quote/);
     });
  
     it('valid repromptSpeech', function() {
      expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/can say yes/);
     });
  
    });

  // 
  describe(`Test NextQuoteIntent correct invocation`, function() {

    before(function(done) {
      event.request.intent = {};
      event.session.attributes = ctx.speechResponse.sessionAttributes;
      event.request.type = 'IntentRequest';
      event.request.intent.name = 'NextQuoteIntent';
      event.request.intent.slots = {};
      ctx.done = done;
      lambdaToTest.handler(event , ctx);
    });

   it('valid response', function() {
     validRsp(ctx, {
       endSession: false
     });
   });

   it('valid outputSpeech', function() {
    expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/one more quote/);
   });

   it('valid repromptSpeech', function() {
    expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/can say yes/);
   });

  });

    // 
    describe(`Test NextQuoteIntent incorrect invocation`, function() {

      before(function(done) {
        event.request.intent = {};
        event.session.attributes = ctx.speechResponse.sessionAttributes;
        event.request.type = 'IntentRequest';
        event.request.intent.name = 'NextQuoteIntent';
        event.request.intent.slots = {};
        ctx.done = done;
        lambdaToTest.handler(event , ctx);
      });
  
     it('valid response', function() {
       validRsp(ctx, {
         endSession: true
       });
     });
  
     it('valid outputSpeech', function() {
      expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Wrong invocation/);
     });
  
    //  it('valid repromptSpeech', function() {
    //   expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/can say yes/);
    //  });
  
    });

    // 
    describe(`Test AMAZON.StopIntent`, function() {

      before(function(done) {
        event.request.intent = {};
        event.session.attributes ={};
        event.request.type = 'IntentRequest';
        event.request.intent.name = 'AMAZON.StopIntent';
        event.request.intent.slots = {};
        ctx.done = done;
        lambdaToTest.handler(event , ctx);
      });
  
     it('valid response', function() {
       validRsp(ctx, {
         endSession: true
       });
     });
  
     it('valid outputSpeech', function() {
      expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Good bye/);
     });
  
    //  it('valid repromptSpeech', function() {
    //   expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/can say yes/);
    //  });
  
    });
});
