var axios = require("axios");

// Minimal replacement for the deprecated `request` package.
// Resolves with { statusCode, body } for every HTTP status (like `request` did)
// and leaves the body as a raw string. Rejects only on network errors.
module.exports = async function send(options) {
  var response = await axios({
    url: options.url,
    method: options.method || "GET",
    headers: options.headers,
    data: options.body,
    validateStatus: () => true,
    responseType: "text",
    transformResponse: (data) => data
  });

  return { statusCode: response.status, body: response.data };
};
