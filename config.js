'use strict';

const secrets = require('./secrets/keys.js');

module.exports = {
    aws_table_name: 'timeseries',
    aws_local_config: {
      region: 'local',
      endpoint: 'http://localhost:8000'
    },
    aws_remote_config: {
    },
    api_key: secrets.api_key,
    base_api_url: 'https://www.alphavantage.co/query?',
    api_function_timeseries_daily: 'TIME_SERIES_DAILY',
    api_function_obv: 'OBV'
  };