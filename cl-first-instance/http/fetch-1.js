"use strict";

// const querystring = require("querystring");
// const FormData = require("form-data");
// const moment = require('moment');
// const url = require('url');
// const cheerio = require('cheerio');
// const fetch = require('node-fetch');//to reconstruct response fetch.Response(html,....)

import * as querystring from 'querystring'
import FormData from 'form-data';
import moment from 'moment';
import * as url from 'url'
import { load } from 'cheerio';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const fetcher = require("../../utils/fetcher");
let fetchWithCookies = fetcher.fetchWithCookies;
// let fetch = fetcher.fetch;//only use fetchWithCookies or defaultFetchURL for Tests
let defaultFetchURL = fetcher.defaultFetchURL;


let map = {};

function setSharedVariable(key, value) {
    map[key] = value;
}

function getSharedVariable(key) {
    return map[key];
}


async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });
}

const objStringToHtml = (str) => {
    let obj = JSON.parse(str.replace(/\s+/g, ' ').replace(/>\s/ig, '>').replace(/\s</ig, '<'));
    let html = "";
    for (let key in obj) {
        html += obj[key];
    }
    return html;
}

const getFallosHome = async function ({ headers }) {
    let customHeaders = {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let requestURL = 'https://www.pjud.cl/transparencia/fallos-sala';
    let responsePage = await fetchPage({ canonicalURL: requestURL, requestOptions });
    setSharedVariable("got-fallos-home", true);
    return responsePage;
};

const getYearMonths = async function ({ year, canonicalURL, headers }) {
    !getSharedVariable("got-fallos-home") && await getFallosHome({ headers });
    let customHeaders = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://www.pjud.cl/transparencia/fallos-sala",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = {};
    data["anio"] = year;
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = { method, body, headers: _headers };
    let requestURL = 'https://www.pjud.cl/ajax/transparency/getmesfallos';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    setSharedVariable("got-year-months", true);
    let html = await responsePage.response.text();
    const $ = cheerio.load(objStringToHtml(html) + "<div id='custom'><h3>Custom Links</h3><ol id='links'></ol></div>");
    let ol = $("#links");
    $("option").each(function (i) {
        let option = $(this);
        let value = option.attr("value");
        if (!value) return;
        let monthURL = `https://www.pjud.cl/primera-instancia/?year=${year}&month=${value}`;
        let li = $(`<li><a href="${monthURL}">${moment(`${year}-${value}-1`, "YYYY-M-D").format("YYYY MMMM")}</a></li>`);
        ol.append(li);
    });
    responsePage.response = new fetch.Response($.html(), responsePage.response);
    return responsePage;
};

/**
 *
 * @param year integer
 * @param month integer
 * @param canonicalURL
 * @param headers
 * @returns {Promise<{request: any, canonicalURL: *, response: *}>}
 */
const getMonthDaysWithDocuments = async function ({ year, month, canonicalURL, headers }) {
    !getSharedVariable("got-year-months") && await getYearMonths({ year, headers });
    let customHeaders = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://www.pjud.cl/transparencia/fallos-sala",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = {};
    data["anio"] = year;
    data["mes"] = month;
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = { method, body, headers: _headers };
    let requestURL = 'https://www.pjud.cl/ajax/transparency/getinfomes';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    setSharedVariable("got-month-days", true);
    let html = await responsePage.response.text();
    const $ = cheerio.load(objStringToHtml(html) + "<div id='custom'><h3>Custom Links</h3><ol id='links'></ol></div>");
    let ol = $("#links");
    let dates = [];
    $("option").each(function (i) {
        let option = $(this);
        let value = option.attr("value");
        if (!value) return;
        dates.push(value);
    });
    dates.sort();
    for (let i = 0; i < dates.length; i++) {
        const value = dates[i];
        let date = moment(`${year}-${month}-${value}`, "YYYY-M-D");
        let dayURL = `https://www.pjud.cl/primera-instancia/fallos/?date=${date.format("YYYY-MM-DD")}`;
        let li = $(`<li><a href="${dayURL}">${date.format("YYYY-MM-DD")}</a></li>`);
        ol.append(li);
    }
    responsePage.response = new fetch.Response($.html(), responsePage.response);
    return responsePage;
};


const getDateCases = async function ({ date, canonicalURL, headers }) {
    !getSharedVariable("got-month-days") && await getMonthDaysWithDocuments({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        headers
    });
    let customHeaders = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://www.pjud.cl/transparencia/fallos-sala",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = {};
    data["anio"] = date.year();
    data["mes"] = date.format("M");
    data["dia"] = date.format("D");
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = { method, body, headers: _headers };
    let requestURL = 'https://www.pjud.cl/ajax/transparency/getinfodia';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    let html = await responsePage.response.text();
    const $ = cheerio.load(`<table>${objStringToHtml(html)}</table>`);
    $("tr").each(function (i) {
        let row = $(this);
        let cells = row.find("td");
        //get text from second cell
        let td = cells.eq(1);
        let text = td.text();
        if (/^\d+\s?-\s?\d{4}$/i.test(text)) {
            const rolURL = `https://www.pjud.cl/primera-instancia/fallos/?rol=${text.replace(/\s/g, "")}`;
            td.html(`<a href="${rolURL}">${text}</a>`);
        }
    });
    responsePage.response = new fetch.Response($.html(), responsePage.response);
    return responsePage;
};

async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const yearMatch = canonicalURL.match(/\?year=(\d{4})$/i);
    const monthMatch = canonicalURL.match(/\?year=(\d{4})&month=(\d{1,2})$/i);
    const dateMatch = canonicalURL.match(/\?date=(\d{4}-\d{2}-\d{2})$/i);
    if (yearMatch) {
        let year = parseInt(yearMatch[1]);
        return [await getYearMonths({ year, canonicalURL, headers })];
    } else if (monthMatch) {
        let year = parseInt(monthMatch[1]);
        let month = parseInt(monthMatch[2]);
        return [await getMonthDaysWithDocuments({ year, month, canonicalURL, headers })];
    } else if (dateMatch) {
        let date = moment(dateMatch[1]);
        return [await getDateCases({ date, canonicalURL, headers })];
    } else {
        return defaultFetchURL({ canonicalURL, headers });
    }
}


const testCrawler = async function () {
    let canonicalURLs = [`https://www.pjud.cl/primera-instancia/fallos/?year=2023`,
        "https://www.pjud.cl/primera-instancia/fallos/?year=2023&month=9",
        "https://www.pjud.cl/primera-instancia/fallos/?year=2023&month=9",
        "https://www.pjud.cl/primera-instancia/fallos/?date=2023-09-20",
        "https://www.pjud.cl/primera-instancia/fallos/?date=2023-09-19"];
    let headers = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15" };
    //const fs = require("fs");
    for (let i = 0; i < canonicalURLs.length; i++) {
        let canonicalURL = canonicalURLs[i];
        let responses = await fetchURL({ canonicalURL, headers });
        for (let i = 0; i < responses.length; i++) {
            let responsePage = responses[i];
            let fileName = responsePage.canonicalURL.replace(/.+[\/?]([^?\/]+)$/i, "$1").replace(/\W/ig, "_");
            let type = responsePage.response.headers.get('content-type');
            let ext = /json/i.test(type) ? "json" : /pdf/i.test(type) ? "pdf" : /\.openxmlformats.*word/i.test(type) ? "docx" : /word/i.test(type) ? "doc" : "html";
            //let filePath = `${__dirname}/../pdf/${fileName}.${ext}`;
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            // Construct the file path
            let filePath = join(__dirname, '..', 'pdf', `${fileName}.${ext}`);

            console.log(filePath);
            let html = await responsePage.response.buffer();
            fs.writeFileSync(filePath, html);
            console.log(`saved file to ${filePath}`);
        }
    }

};

testCrawler();
