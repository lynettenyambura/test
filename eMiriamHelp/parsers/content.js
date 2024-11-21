"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
// const url = require("url");
// const querystring = require("querystring");
import moment from "moment";
import cheerio from "cheerio";
import url from "url";
import querystring from "querystring";
import fs from 'fs';
import path from 'path';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';


function parsePage({ responseBody, URL, html, referer }) {
    const $ = cheerio.load(responseBody.content, { decodeEntities: true });
    let parseHtml = false;
    $("main>").each(function (i) {
        let e = $(this);
        if (parseHtml === false) parseHtml = !!(e.find('hr').length || e.prop("name") === 'hr') && " " || false;
        else {
            parseHtml += `${$.html(e)}`
        }
        console.log(i, e.text().replace(/\s+/g, " ").trim());
    });
    return [{ URI: URL, content: { content: parseHtml, fileFormat: "text/format", locale: "en" } }];
}

const parserTest = function () {
    //const fs = require("fs");
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);
   
    // Get the directory of the current module
    const currentDir = path.dirname(new URL(import.meta.url).pathname);

    // Construct the path to the "projects.txt" file
    const filePath = path.join(currentDir, "/../pdf/d.html");
    let buffer = fs.readFileSync(filePath);

    buffer = parsePage({
        responseBody: { content: buffer, buffer, fileFormat: "text/html" },
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
