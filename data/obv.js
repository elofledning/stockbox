'use strict';
const util = require("../data/util.js");
const https = require('https');

const config = require('../config.js');

module.exports.persistHandler = (event, context, callback) => {
    let symbol = 'MSFT';

    //Retrieve and process API data 
    //https://www.alphavantage.co/query?function=OBV&symbol=MSFT&interval=weekly&apikey=demo
    processData(config.base_api_url + 'function=' + config.api_function_obv + '&symbol=' + symbol + '&interval=daily' + '&apikey=' + config.api_key);

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
                util.batchWrite(buildParams(data), callback);
            });

        }).on("error", (err) => {
            let errMsg = "Error: " + err.message;
            console.log(errMsg);
            callback(errMsg);
        });
    }

    //Build params for DB persist
    function buildParams(jsonResult) {
        try {
            let objRoot = JSON.parse(jsonResult);
            let timeIndex = util.getTimeDayJSON(objRoot['Technical Analysis: OBV'], 10);
            let paramItems = [];

            //loops "Technical Analysis: OBV"
            timeIndex.forEach(function (value) {
                paramItems.push({
                    PutRequest: {
                        Item: {
                            symbol: symbol,
                            timeday: value.timeDay,
                            obv: value['OBV']
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
};