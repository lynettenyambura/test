"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parsePage({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const $ = cheerio.load(responseBody.content, {decodeEntities: false});
    const results = [];

    return results;
}

const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/../pdf/listing.html");
    buffer = parsePage({
        responseBody: {content: buffer.toString(), buffer, fileFormat: "text/html"},
        URL: "http://iceber.",
        referer: "http://iceber.",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
