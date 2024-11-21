"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
// const url = require("url");
// const querystring = require("querystring");

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs';

const sanitizeHtml = (x) => x;

function _parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const $ = load(responseBody.content, { decodeEntities: false });
    const results = [];
    let match = /(var|let|const)\s+id_buscador_activo\s*=\s*([\d-_]+)/i.exec(responseBody.content);
    let id_buscador_activo = match && match[2] || null;
    let token = $("input[name='_token']").val();
    console.log(id_buscador_activo, token);
    return results;
}
function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const j = JSON.parse(responseBody.content);
    return j.response.docs;
}

const parserTest = function () {
    // const fs = require("fs");
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const filePath = path.join(currentDir, "/../pdf/json.json")


    // let buffer = fs.readFileSync(__dirname + "/../pdf/json.json");
    let buffer = fs.readFileSync(filePath)
    buffer = parsePage({
        responseBody: { content: buffer.toString(), buffer, fileFormat: "text/json" },
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
