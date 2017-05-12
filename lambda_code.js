//=======================================================================
// MQTT SECTION (REST CAll OVER MQTT)
//=======================================================================

var awsIot = require('aws-iot-device-sdk');
var crypto = require("crypto");

var aws_IoT_Region_Name = "us-east-1";
var aws_IoT_Certificate_File_Name = "d1111ec055-certificate.pem.crt";
var aws_IoT_Private_Key_File_Name = "d1111ec055-private.pem.key";
var aws_IoT_Root_Certificate_File_Name = "root-CA.crt";
var timeOutInterval = 16000;



function post_UCSD_Data (ucsdPayload, intent, session, callback) {

    var varMqttClientID = crypto.randomBytes(16).toString('hex');
    var strSessionID = (((session.sessionId).toString()).split("."))[1];

    var ucsdRequestTopic = "ucsd/alexa/request/" + strSessionID;
    var ucsdResponseTopic = "ucsd/alexa/response/" + strSessionID;
    var mqttClientAutoTimeOut;

    // Initiate AWS IoT MQTT Client
    var mqttUcsdRequestClient = awsIot.device({
       keyPath: aws_IoT_Private_Key_File_Name,
      certPath: aws_IoT_Certificate_File_Name,
        caPath: aws_IoT_Root_Certificate_File_Name,
      clientId: varMqttClientID,
        region: aws_IoT_Region_Name
    });

    // On successful connection with AWS IoT MQTT Server
    mqttUcsdRequestClient
      .on('connect', function() {
        // Subscript to Response Topic for UCSD Service Request ID
        mqttUcsdRequestClient.subscribe(ucsdResponseTopic);
        // Publish data for VM Provisioning
        mqttUcsdRequestClient.publish(ucsdRequestTopic, ucsdPayload);
        // Set Auto Disconnection Timer after Publishing Message
        mqttClientAutoTimeOut = setTimeout(autoDisconnectMqttClient, timeOutInterval);
        });


    // Wait for the Service Request ID from Cisco UCSD.
    mqttUcsdRequestClient
      .on('message', function(topic, payload) {
        //console.log('message', topic, payload.toString());
        // Disconnect the MQTT Client
        mqttUcsdRequestClient.end("force");
        // Stop Auto Disconnect / Time-out function (autoDisconnectMqttClient).
        clearTimeout(mqttClientAutoTimeOut);

        var speechOutput = "You Request for " + ucsdPayload + " Virtual Machine have been submitted to Cisco U.C.S.D.."
                                  + " You may track this request with Service Request # " + payload.toString() + " . Chaao bello."  
        var repromptText = "Good Bye";
        var header = "Success";
        var shouldEndSession = true;
        var sessionAttributes = {};
        callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession));  


       });

    // Auto Time Out in case of no response from Cisco UCSD
    function autoDisconnectMqttClient() {
        // Request Timed Out (check value in "timeOutInterval" variable) Close MQTT Session
        mqttUcsdRequestClient.end("force");

        var speechOutput = "No Response received from Cisco U.C.S.D.. Please check UCSD Console or try again later. Good Bye";
        var repromptText = "Good Bye";
        var header = "Failed or No Response";
        var shouldEndSession = true;
        var sessionAttributes = {};
        callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession));        

    }
}




//post_UCSD_Data(JSON.stringify({ test_data: 1}), "ABC");

//=======================================================================




exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

    // if (event.session.application.applicationId !== "") {
    //     context.fail("Invalid Application ID");
    //  }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "ProvisionVMIntent") {
        handleProvisionVMRequest(intent, session, callback);

    } else if (intentName == "VMSizeIntent") {
        handleVMSizeIntent(intent, session, callback);

    } else if (intentName == "AMAZON.YesIntent") {
        handleYesRequest(intent, session, callback);

    } else if (intentName == "AMAZON.NoIntent") {
        handleNoRequest(intent, session, callback);

    } else if (intentName == "AMAZON.HelpIntent") {
        handleGetHelpRequest(intent, session, callback);

    } else if (intentName == "AMAZON.StopIntent") {
        handleStopRequest(intent, session, callback);

    } else if (intentName == "AMAZON.CancelIntent") {
        handleCancelRequest(intent, session, callback);

    } else {
        throw "Invalid intent"
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to Cisco U.C.S.D. VM Catalog."
                        + ". You can select one of the Virtual Machine Sizes. "
                            + "Small. Medium. or Large."
                              + ". Which one do you want?";

    var repromptText = "Please select the VM Size from Small. Medium. or Large.";
    var header = "Select VM Size";
    var shouldEndSession = false;

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : repromptText
    };
    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession)); 
}


function handleProvisionVMRequest(intent, session, callback) {
    var speechOutput = "Welcome to Cisco U.C.S.D. VM Catalog."
                        + ". You can select one of the Virtual Machine Sizes. "
                            + "Small. Medium. or Large. "
                              + ". Which one do you want?";

    var repromptText = "Please select the VM Size from Small. Medium. or Large.";
    var header = "Select VM Size";
    var shouldEndSession = false;

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : repromptText
    };
    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession));    
}


function handleVMSizeIntent(intent, session, callback) {
    var selectedVMSize = ((intent.slots.VMSize.value).toString()).toLowerCase();
    post_UCSD_Data (selectedVMSize, intent, session, callback) 
}

function handleYesRequest(intent, session, callback) {
    //post_UCSD_Data ("from alexa with love", intent, session, callback)
}



function handleNoRequest(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback);
}

function handleStopRequest(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback);
}

function handleCancelRequest(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback);
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    var speechOutput = "With this alexa skill you may deploy a new Virtual Machine using Cisco UCS Director."
                        + "All you need to say is Alexa ask UCSD to deploy a Virtual Machine."
                        + " and follow the instructions.";
    var repromptText = "You may start the process by saying; Alexa ask UCSD to deploy a Virtual Machine.";
    var header = "Cisco UCSD Alexa Service Catalog";
    var shouldEndSession = false;
    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : repromptText
    }
    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession))

}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
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
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}