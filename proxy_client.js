var awsIot = require('aws-iot-device-sdk');
var crypto = require("crypto");
var request = require("request");

var aws_IoT_Region_Name = "us-east-1";
var aws_IoT_Certificate_File_Name = "d1111ec055-certificate.pem.crt";
var aws_IoT_Private_Key_File_Name = "d1111ec055-private.pem.key";
var aws_IoT_Root_Certificate_File_Name = "root-CA.crt";
//var waitInterval = 0;


var ucsdRequestTopic = "ucsd/alexa/request/#";
var ucsdServiceRequestID;
var ucsdResponseTopic;
var varClientID = crypto.randomBytes(16).toString('hex');


var mqttUcsdRequestClient = awsIot.device({
    keyPath: aws_IoT_Private_Key_File_Name,
    certPath: aws_IoT_Certificate_File_Name,
    caPath: aws_IoT_Root_Certificate_File_Name,
    clientId: varClientID,
    region: aws_IoT_Region_Name
    });

mqttUcsdRequestClient
    .on('connect', function() {
      mqttUcsdRequestClient.subscribe(ucsdRequestTopic);
    });

mqttUcsdRequestClient
    .on('message', function(topic, payload) {
    console.log('message', topic, payload.toString());

    ucsdResponseTopic = "ucsd/alexa/response/" + ((topic.toString()).split("/"))[3];

    console.log('Response Topic:', ucsdResponseTopic);

    invokeUcsdWorkflow();

    });


function invokeUcsdWorkflow() {

    
    var options = { method: 'GET',
      url: 'http://10.68.45.57/app/api/rest',
      strictSSL: false, 
      rejectUnauthorized: false,
      qs: 
       { formatType: 'json',
         opName: 'userAPISubmitWorkflowServiceRequest',
         opData: '{param0:"Test Network Connectivity",param1:{"list":[{}]},param2:-1}' },
      headers: 
       { 'postman-token': 'de38ca06-c460-c80f-0bb3-be1040a3dbbb',
         'cache-control': 'no-cache',
         'x-cloupia-request-key': '1F5621842D24433584FCF9ED99790CC1' } };

    request(options, function (error, response, body) {
      if (error) {
        console.log(error);
        throw new Error(error);
      };

      var httpResponseJson = JSON.parse(body);
      ucsdServiceRequestID = (httpResponseJson.serviceResult).toString();
      
      sendAlexaResponse(ucsdServiceRequestID);

    });


}

function sendAlexaResponse(ucsdServiceRequestID){
    mqttUcsdRequestClient.publish(ucsdResponseTopic, ucsdServiceRequestID);
    console.log ("serviceResult: " + ucsdServiceRequestID);
}



