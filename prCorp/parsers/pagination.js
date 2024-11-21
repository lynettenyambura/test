"use strict";

const moment = require("moment");
const cheerio = require("cheerio");

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
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/../pdf/res.html");
    buffer = parsePage({responseBody: {content: buffer}, URL: "http://res.res/"});
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();