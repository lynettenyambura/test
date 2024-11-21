"use strict";

const moment = require("moment");
const cheerio = require("cheerio");

function parsePage({URL, responseBody, html}) {
    const out = {
        URI: URL
    };
    out.originalPdf = [{
        mediaObjectId: responseBody.id,
        fileFormat: responseBody.fileFormat,
        // dataType: "MEDIA",
        locale: "es"
    }];

    if (html) {
        let $ = cheerio.load(html);
        if ($.text().length > 500) {
            out.htmlContent = {fileFormat: "text/html", content: html, dataType: "MEDIA"};
        }
    }
    return [out];
}