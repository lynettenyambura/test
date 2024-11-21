"use strict";

const querystring = require("querystring");
const FormData = require("form-data");
const moment = require('moment');
const url = require('url');
const cheerio = require('cheerio');
const fetch = require('node-fetch'); //to reconstruct response fetch.Response(html,....)
const mkdirp = require("mkdirp");

const fetcher = require("../../../utils/fetcher");
let fetchWithCookies = fetcher.fetchWithCookies;
// let fetch = fetcher.fetch; //only use fetchWithCookies or defaultFetchURL for Tests
let defaultFetchURL = fetcher.defaultFetchURL;


let map = {};

function setSharedVariable(key, value) {
    map[key] = value;
}

function getSharedVariable(key) {
    return map[key];
}


/*DO NOT NOT INCLUDE ANYTHING ABOVE THIS LINE ON ICEBERG*/

async function fetchPage({canonicalURL, requestURL, requestOptions, headers}) {
    if (!requestOptions) requestOptions = {method: "GET", headers};
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({URL: requestURL}, requestOptions),
                response
            };
        });
}

//YOUR FUNCTIONS

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        //ignore requests to social media urls
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/some pattern/i);
    if (match) {
        return [await fetchPage({canonicalURL, headers})]
    } else {
        return defaultFetchURL({canonicalURL, headers});
    }
}

/*DO NOT INCLUDE BELOW THIS LINE IN ICEBERG*/

const fs = require("fs"); //you can read and write in /../pdf, all 'pdf' dirs ignored in git

const testerFunction = async function () {
    mkdirp.sync("../pdf");
    let urlSequence = ["http://example.com"];
    let headers = {};
    for (let i = 0; i < urlSequence.length; i++) {
        let canonicalURL = urlSequence[i];
        let response = await fetchURL({canonicalURL, headers});
        if (Array.isArray(response)) {
            for (let j = 0; j < response.length; j++) {
                let responsePage = response[j];
                await visualizeResponse({responsePage})
            }
        }
    }
};

const visualizeResponse = async function ({responsePage}) {
    console.log(responsePage.canonicalURL);
    console.log(responsePage.response.status);
    let content_type = responsePage.response.headers.get('content-type');
    console.log(content_type);
    if (/text/i.test(content_type)) {
        let text = await responsePage.response.buffer();
        //Do something with response

    }
};
testerFunction();