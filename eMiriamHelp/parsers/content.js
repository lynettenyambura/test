"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");

function parsePage({responseBody, URL, html, referer}) {
    const $ = cheerio.load(responseBody.content, {decodeEntities: true});
    let parseHtml = false;
    $("main>").each(function (i) {
        let e = $(this);
        if (parseHtml === false) parseHtml = !!(e.find('hr').length || e.prop("name") === 'hr') && " " || false;
        else {
            parseHtml += `${$.html(e)}`
        }
        console.log(i, e.text().replace(/\s+/g, " ").trim());
    });
    return [{URI: URL, content: {content: parseHtml, fileFormat: "text/format", locale: "en"}}];
}

const parserTest = function () {
    const fs = require("fs");

    let buffer = fs.readFileSync(__dirname + "/../pdf/d.html");
    buffer = parsePage({
        responseBody: {content: buffer, buffer, fileFormat: "text/html"},
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
