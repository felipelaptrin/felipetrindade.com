'use strict';
exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else {
    request.uri += '/index.html';
  }

  callback(null, request);
};