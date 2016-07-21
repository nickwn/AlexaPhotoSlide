var iot = require('aws-iot-device-sdk');
var config = require('./config');

var mqttConfig = {
	'keyPath': "certs/lambda/24d2f060b8-private.pem.key",
	'certPath': "certs/lambda/24d2f060b8-certificate.pem.crt",
	'caPath': "certs/lambda/rootCA.key",
	'host': config.host,
	'port': 8883,
	'clientId': 'Lambda-alexaPhotoSlide',
	'region': 'us-east-1',
	'debug': true
};

var client = null;

exports.handler = function(event, context) {
	//if (event.session.application.applicationId != config.appId) {
	//	throw "invalid app id";
	//}

	client = iot.device(mqttConfig);

	client.on('connect', function() {
		console.log("connected to aws iot");
	});
	
	if (event.session.new) {
		console.log("session started");
	}

	if (event.request.type == "LaunchRequest") {
		return onLaunch(event);
	} else if (event.request.type == "IntentRequest") {
		return onIntent(event);
	} else if (event.request.type == "SessionEndedRequest") {
		return onSessionEnded(event);
	}
}

/* ---------- Request Handlers ---------- */

function onLaunch(event) {
	console.log("handling launch request");

	var sessionAttributes = {};
	var title = "Welcome";
	var output = "welcome to photo slide";
	var reprompt = "i can show you the previous photo, " +
               		"show you the next photo, " +
               		"pause the slide show, " +
               		"or switch to a different album.";
	var shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	return buildResponse(sessionAttributes, speechlet);
}

function onIntent(event) {
	console.log("handling intent request");
	var intent = event.request.intent;
	var intentName = intent.name;
	
	console.log("intent name: " + intentName);

	if(intentName == "AMAZON.HelpIntent") {
        return helpIntent(intent);
    } else if(intentName == "AMAZON.NextIntent") {
        return nextIntent(intent);
    } else if(intentName == "AMAZON.PreviousIntent") { 
        return previousIntent(intent);
    } else if(intentName == "AMAZON.PauseIntent") {
        return pauseIntent(intent);
    } else if(intentName == "SwitchAlbumIntent") {
        return switchAlbumIntent(intent);
    } else {
		throw "invalid intent";
	}
}

function onSessionEnded(event) {
	console.log("handling session ended request");
}

/* ---------- Intent Handlers ---------- */

function helpIntent(intent) {
	console.log("help");
	var sessionAttributes = {};
	var title = "Help";
	var output = "i can show you the previous photo, " +
               	 "show you the next photo, " +
               	 "pause the slide show, " +
               	 "or switch to a different album.";
	var reprompt = output;
	var shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	return buildResponse(sessionAttributes, speechlet);
}

function nextIntent(intent) {
	payload = {'action': 'Next'};
	
	sessionAttributes = {};
	title = "Next Photo";
	output = null;
	reprompt = null;
	shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	var res = buildResponse(sessionAttributes, speechlet);
	
	return mqttPublish(payload, res);
}

function previousIntent(intent) {
	payload = {'action': 'Previous'};
	
	sessionAttributes = {};
	title = "Previous Photo";
	output = null;
	reprompt = null;
	shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	var res = buildResponse(sessionAttributes, speechlet);
	
	return mqttPublish(payload, res);
}

function pauseIntent(intent) {
	payload = {'action': 'Pause'};
	
	sessionAttributes = {};
	title = "Pause Photo Slide";
	output = "paused photo slide";
	reprompt = null;
	shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	var res = buildResponse(sessionAttributes, speechlet);
	
	return mqttPublish(payload, res);
}

function switchAlbumIntent(intent) {
	album = intent.slots.Album.value;
	payload = {'action': 'SwitchAlbum', 'album': album};

	sessionAttributes = {};
	title = "Switch Album";
	output = "switched album to " + album;
	reprompt = null;
	shouldEndSession = false;

	var speechlet = buildSpeechlet(title, output, reprompt, shouldEndSession);
	var res = buildResponse(sessionAttributes, speechlet);
	
	return mqttPublish(payload, res);
}

/* ---------- Response Builders ---------- */

function buildSpeechlet(title, output, reprompt, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: reprompt
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechlet) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechlet
    }
}

/* ---------- Utilities ---------- */

function mqttPublish(payload, res) {
	var strPayload = JSON.stringify(payload);
	client.publish(config.topic, strPayload, false);
	client.end();

	client.on('message', function(topic, payload) {
		if(payload.error) {
			 res.response.outputSpeech.text = payload.error;
		}
	});

	client.on('error', function(err, granted) {
		console.log("mqtt client error: " + err);
	});

	return res;
}


