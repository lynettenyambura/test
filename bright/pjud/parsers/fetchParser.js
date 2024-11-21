"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
// const url = require("url");
// const querystring = require("querystring");

import moment from "moment";
import { load } from "cheerio";
import * as url from 'url'
import * as querystring from 'querystring'
import fs from 'fs';
import path from 'path'
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const $ = load(responseBody.content, { decodeEntities: false });
    const results = [];
    let numberedPageDiv = $("#capa_botones_paginas");
    let paginationDiv = numberedPageDiv.parent();
    let paginationObj = {
        first: null, beforeFirstShown: null, afterLastShown: null, last: null, pages: {}
    };
    let min = 0;
    let max = 0;
    numberedPageDiv.find('a').each(function (i) {
        let a = $(this);
        let label = a.text().trim();
        let pageNumber = parseInt(label);
        if (pageNumber && (!max || pageNumber > max))
            max = pageNumber;
        if (pageNumber && (!min || pageNumber < min))
            min = pageNumber;
        pageNumber && (paginationObj.pages[pageNumber] = {
            page: pageNumber,
            xselector: `//div[@id='capa_botones_paginas']//a[contains(text(),'${pageNumber}')]`
        });
    });
    if (Object.keys(paginationObj.pages).length) {
        //We have pages
        paginationObj.first = {
            page: 1,
            selector: '#btnPaginador_inicio'
        }
        if (min > 1)
            paginationObj.beforeFirstShown = {
                page: min - 1,
                selector: '#btnPaginador_pagina_atras'
            }
        if (max > 0)
            paginationObj.afterLastShown = {
                page: max + 1,
                selector: "#btnPaginador_pagina_adelante"
            }
        paginationObj.last = {
            page: -1,
            selector: "#btnPaginador_fin"
        }
    }
    results.push(paginationObj);
    return results;
}

const parserTest = function () {
    // const fs = require("fs");
    const filePath = path.join(path.dirname(new URL(import.meta.url).pathname), '/../pdf/pagination.html');

    // let buffer = fs.readFileSync(__dirname + "/../pdf/pagination.html");
    let buffer = fs.readFileSync(filePath)
    buffer = parsePage({
        responseBody: { content: buffer.toString(), buffer, fileFormat: "text/html" },
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
