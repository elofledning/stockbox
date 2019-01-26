'use strict';
var https = require('https');

var AWS = require("aws-sdk");
const config = require('../config.js');
const secrets = require('../secrets/keys.js');
AWS.config.update(config.aws_local_config); //loads local dynamodbdb config

var doc = new AWS.DynamoDB.DocumentClient();

const baseUrl = 'https://www.alphavantage.co/query?';
const apiKey = secrets.api_key;
const apiFunction = 'TIME_SERIES_DAILY';

module.exports.persistHandler = (event, context, callback) => {
    console.info("Request received:\n", JSON.stringify(event));
    console.info("Context received:\n", JSON.stringify(context));

    let symbol = 'CRM';
    let ts = new Date().getTime();

    //scan();
    //Retrieve and process API data synchronously
    processData(baseUrl + 'function=' + apiFunction + '&symbol=' + symbol + '&apikey=' + apiKey);

    //Gets JSON string from url API defined
    function processData(url) {
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            resp.on('end', () => {
                console.log('End of API request for URL: ' + url + '. Data: ' + data.length);
                persist(getParams(data));
            });

        }).on("error", (err) => {
            let errMsg = "Error: " + err.message;
            console.log(errMsg);
            callback(errMsg);
        });
    }

    function getParams(jsonResult) {
        try {
            let objRoot = JSON.parse(jsonResult);
            let timeIndex = jsonObjToIndex(objRoot['Time\u0020Series\u0020(Daily)'], 10);
            let paramItems = [];

            //loops "Time Series (Daily)"
            timeIndex.forEach(function (value) {
                paramItems.push({
                    PutRequest: {
                        Item: {
                            symbol: symbol,
                            timeday: value.timeDay,
                            open: value['1.\u0020open'],
                            close: value['4.\u0020close']
                        }
                    }
                });
            });
            let params = {
                RequestItems: {
                    timeseries: paramItems
                }
            };
            return params;

        } catch (err) {
            var errMsg = 'JSON.parse ERROR: ' + err;
            console.log(errMsg)
            callback(errMsg);
        }
    }

    function persist(params) {

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

    function jsonObjToIndex(obj, max) {
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
    }

    function showKeysJSONObj(p) {
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                console.log(key + " -> " + p[key]);
            }
        }
    }

    function scan() {
        const params = {
            TableName: config.aws_table_name
        };
        doc.scan(params, function (err, data) {
            if (err) {
                let errMsg = "Error: " + err.message;
                console.log(errMsg);
                callback(errMsg);
            } else {
                const { Items } = data;
                console.log('ITEMS: ' + JSON.stringify(Items));
                callback(null, "Callback success for lambda function timeseries.js");
            }
        });
    }
};