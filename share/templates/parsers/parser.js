"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
let sanitizeHtml = require("sanitize-html");
let iconv = require("iconv-lite");
const mkdirp = require("mkdirp");


function parsePage({responseBody, html, URL, referer}) {
    const $ = cheerio.load(responseBody.content);
    const results = [];

    //YOUR CODE

    return results;
}

const parserTest = function () {
    const fs = require("fs");
    mkdirp.sync("../pdf");
    let buffer = fs.readFileSync(__dirname + "/../pdf/FILE.html");//point to real file
    buffer = parsePage({responseBody: {content: buffer}, URL: "URL"});//provide real URL
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();