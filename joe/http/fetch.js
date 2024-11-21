"use strict";

const querystring = require("querystring");
const FormData = require("form-data");
const moment = require('moment');
const url = require('url');
const cheerio = require('cheerio');
const fetch = require('node-fetch');//to reconstruct response fetch.Response(html,....)

const fetcher = require("../../utils/fetcher");
let fetchWithCookies = fetcher.fetchWithCookies;
// let fetch = fetcher.fetch;//only use fetchWithCookies or defaultFetchURL for Tests
let defaultFetchURL = fetcher.defaultFetchURL;


let map = {};

function setSharedVariable(key, value) {
    map[key] = value;
}

function getSharedVariable(key) {
    return map[key];
}


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


const accueil = async function ({headers}) {
    let customHeaders = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://juportal.be",
        "Referer": "https://juportal.be/home/accueil",
        "Upgrade-Insecure-Requests": "1",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = {};
    data["latitude"] = ``;
    data["longitude"] = ``;
    data["accuracy"] = ``;
    data["altitude"] = ``;
    data["altitudeAccuracy"] = ``;
    data["nouvelle_recherche"] = ``;
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://juportal.be/home/accueil';
    let responsePage = await fetchPage({canonicalURL: requestURL, requestOptions});
    return responsePage;
};

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/\?(start|from)=(\d{4}-\d{2}-\d{2}).(end|to)=(\d{4}-\d{2}-\d{2})(&page=(\d+))?$/i);
    if (match) {
        let from = moment(match[2]);
        let to = moment(match[4]);
        let page = match[6] ? parseInt(match[6]) : 1;
        return [await fetchURL({canonicalURL, headers})]
    } else {
        return defaultFetchURL({canonicalURL, headers});
    }
}
