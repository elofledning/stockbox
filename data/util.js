'use strict';

const config = require('../config.js');
const AWS = require("aws-sdk");

AWS.config.update(config.aws_local_config); //loads local dynamodbdb config
var doc = new AWS.DynamoDB.DocumentClient();

//Returns child json objects for anonymous json object where timeday is key
module.exports.getTimeDayJSON = (obj, max) => {
    
    var index = [];
    var count = 0;

    // build the index
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var singleObj = obj[key];
            singleObj.timeDay = key;
            index.push(singleObj);
        }
        count++;

        if (count >= max) {
            break;
        }
    }
    return index;
    
};

//Persist params
module.exports.batchWrite = (params, callback) => {
    doc.batchWrite(params, function (err, data) {
        if (err) {
            console.log('Error put Item: ' + err);
            callback(err);
        } else {
            console.log('Data Success put Items. ', JSON.stringify(data));
            callback(null, "Callback success for lambda function timeseries.js");
        }
    });
}


//Scan a table
module.exports.scan = (tableName) => {  
    const params = {
        TableName: tableName
    };
    doc.scan(params, function (err, data) {
        if (err) {
            let errMsg = "Error: " + err.message;
            console.log(errMsg);
            callback(errMsg);
        } else {
            const { Items } = data;
            console.log('ITEMS: ' + JSON.stringify(Items));
            callback(null, "Callback success for scan of table "+tableName);
        }
    });      
}