"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
import moment from "moment";
import  cheerio from "cheerio";
import fs from 'fs';
import path from 'path';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

function parsePage({responseBody, URL}) {
    const $ = cheerio.load(responseBody.content);
    const results = [];
    let paginationText = $("span.RecCount:contains('Records')").first().text().replace(/\s+/g, " ").trim();
    let max = parseInt(/.+\s+(\d+)$/.exec(paginationText)[1]);
    let pages = Math.ceil(max / 10);
    $("body").append("<div id='injected_links'><h2>Injected Links</h2></div>")
    for (let i = 2; i <= pages; i++) {
        $(`div#injected_links`).append(`<a href="https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx?page=${i}">${i}</a> ${(i+2)%20===0?"<br/>":"0"}`)
    }
    return results;
}

const parserTest = function () {
    //const fs = require("fs");
    // Get the directory of the current module
    const currentDir = path.dirname(new URL(import.meta.url).pathname);

    // Construct the path to the "projects.txt" file
    const filePath = path.join(currentDir, "/../pdf/res.html");
    let buffer = fs.readFileSync(filePath);
    buffer = parsePage({responseBody: {content: buffer}, URL: "http://res.res/"});
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();