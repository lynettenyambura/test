"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parsePage({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let object = JSON.parse(responseBody.content);

    const results = [];
    object && object.data && object.data.viewer && object.data.viewer.records
    && object.data.viewer.records.edges && object.data.viewer.records.edges.forEach(o => {
        o && o.node && o.node.uris && o.node.uris.forEach(u => {
            // /\.(pdf|docx?)/i.test(u) &&
            console.log(u);
        });
    })
    return results;
}

const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/./pdf/iceberg_urls.json");
    buffer = parsePage({
        responseBody: {content: buffer.toString(), buffer, fileFormat: "text/html"},
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
