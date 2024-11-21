"use strict";

const https = require("https");
let requestURL = "https://tindase.com/sfdadfs";//server that leads https error on request
//handle as follows in fetchPage, ie modify node-fetch options
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({rejectUnauthorized: false, keepAlive: true});
    }

// console.log(require("constants").SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION);
