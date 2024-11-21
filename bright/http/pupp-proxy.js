// const puppeteer = require('puppeteer-core');
const auth = 'brd-customer-hl_c6129ab6-zone-scraping_browser1:j6x7j107kgpw';
// const fs = require("fs");
// const moment = require("moment");
// const cheerio = require("cheerio");

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import moment from 'moment';
import { load } from 'cheerio';

const simpleResponse = function (x) {
    return x;
};

let browser, page;

const requestIsPost = function (request) {
    return request.method() === 'POST' && request.url() === 'https://juris.pjud.cl/busqueda/buscar_sentencias';
};


const openDoc = async function ({ canonicalURL, headers }) {
    let page = await getPage();
    let failed = false;
    let text = null;
    let responses = {};
    let tabs = 1;
    page.on('response', async (response) => {
        let url = response.url();
        let method = response.request().method();
        let responseHeaders = response.headers();
        let status = response.status();
        let contentType = responseHeaders['content-type'];
        if ((/post/i.test(method) || /json/i.test(contentType)) && /busqueda|service/i.test(url)) {
            console.log('response', status, method, url, contentType);
            if (/\/busqueda\/buscar_sentencias\b/i.test(url)) {
                const postData = response.request().postData();
                // fs.writeFileSync(__dirname + `/../pdf/post_doc_${count++}.txt`, postData);
                responses.main = {
                    status,
                    postData: undefined,
                    response: await response.text(),
                    contentType
                };
            } else if (/\/busqueda\/webservices\b/i.test(url)) {
                const postData = response.request().postData();
                // fs.writeFileSync(__dirname + `/../pdf/post_doc_${count++}.txt`, postData);
                responses[`tab_${tabs++}`] = {
                    status,
                    postData: undefined,
                    response: await response.text(),
                    contentType
                };
            }
        }
    });
    try {
        await page.goto("https://juris.pjud.cl/busqueda", { waitUntil: 'networkidle2' });
        await page.goto(canonicalURL, { waitUntil: 'networkidle2' });
        await page.waitForNavigation({ timeout: 60000 }).catch(e => {
            console.log('navigation error', e);
            // failed = e;
        });
        await page.waitForSelector("#nav-corte_apelaciones-tab").catch(e => {
            console.log('error', e);
            // failed = e;
        });
        text = await page.content();
        // await page.screenshot({path: __dirname + '/../pdf/doc.png', fullPage: true});
    } catch (e) {
        console.log('error', e);
        failed = e;
    } finally {
        await browser.close();
    }
    if (failed)
        console.error('failed', failed)
    //check if responses.main.status === 200 and responses.main.response has content
    if (responses?.main?.status === 200 && responses.main.response) {
        return simpleResponse({
            canonicalURL,
            responseBody: JSON.stringify({ responses, text }, null, 1),
            mimeType: 'application/json'
        });
    }
    throw new Error('failed to get doc ' + canonicalURL);
};

const getPage = async function () {
    browser = await puppeteer.connect({
        browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`,
    });
    let page = await browser.newPage();
    //do not download images
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.resourceType() === 'image') {
            request.abort();
        } else {
            request.continue();
        }
    });
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    return page;
};

let count = 1;

const getLargestPageSize = async function (pageSize) {
    let selectId = "resultados_busqueda_registros_por_pagina";
    // get select options
    let options = await page.evaluate((selectId) => {
        let select = document.getElementById(selectId);
        let options = [];
        for (let i = 0; i < select.options.length; i++) {
            options.push(select.options[i].value && parseInt(select.options[i].value) || 0);
        }
        return options.filter(x => x && x > 0);
    }, selectId);
    // get closest option
    let largest = 0;
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        if (!largest || option > largest) {
            largest = option;
        }
    }
    console.log('largest', largest);
    return largest;
};

async function search({ canonicalURL, headers }) {
    let match = canonicalURL.match(/from=(\d{4}-\d{2}-\d{2})&to=(\d{4}-\d{2}-\d{2})(&pageSize=(\d+)&page=(\d+))?/);
    const desde = match && match[1];
    const hasta = match && match[2];
    const pageNo = match && parseInt(match[5]) || 1;
    //updated from page
    let pageSize = match && parseInt(match[4]) || 0;
    const responses = [];
    let html;
    try {
        page = await getPage();
        page.on('response', async (response) => {
            const request = response.request();
            if (requestIsPost(request)) {
                //get request body
                const postData = request.postData();
                // fs.writeFileSync(__dirname + `/../pdf/post_${count++}.txt`, postData);
                //get request headers
                console.log('response', response.status(), response.url());
                if (response.status() === 200 && /json/i.test(response.headers()['content-type'])) {
                    //parse dates from post data, can be empty "fec_desde":"2019-01-01","fec_hasta":"2019-12-31"
                    let match = postData.match(/"fec_desde"\s*:\s*"([^"]*)"/);
                    let desde = match && match[1];
                    match = postData.match(/"fec_hasta":"([^"]*)"/);
                    let hasta = match && match[1];
                    let baseURL = canonicalURL.replace(/&from=.+/, '');
                    console.log('baseURL', baseURL, 'desde', desde, 'hasta', hasta);
                    const text = await response.text();
                    let j = JSON.parse(text);
                    let perPage = parseInt(j?.responseHeader?.params?.rows || "0");
                    let start = parseInt(j?.responseHeader?.params?.start || "0");
                    let page = start && Math.floor(start / perPage) + 1;
                    let newCanonical = `${baseURL}&from=${desde}&to=${hasta}${perPage ? '&pageSize=' + perPage : ''}${page ? '&page=' + page : ''}`;
                    responses.push(simpleResponse({
                        canonicalURL: newCanonical,
                        responseBody: j,
                        mimeType: 'application/json'
                    }));
                    // fs.writeFileSync(__dirname + `/../pdf/response_${count++}.json`, text);
                    // console.log(text);
                }
                console.log('------------------------');
            }
        })
        let requestURL = canonicalURL.replace(/&from=.+/, '');
        console.log('navigating to jurisprudencia: ' + requestURL);
        await page.goto(requestURL, { waitUntil: 'networkidle2' });
        try {
            console.log('waiting for search form');
            await page.waitForSelector('.botones-busqueda-avanzada, .btn_buscar', { timeout: 60000 }).catch(e => {
                console.log('error: but maybe the other buttons are available', e);
            });
            console.log('clicking search form');
            await page.waitForSelector('.btn_buscar');
            await page.waitForXPath(`//button[contains(@onclick, 'mostrar_ocultar_busqueda_avanzada')]`);
            let tries = 0;
            do {
                tries++;
                if (tries > 10) throw new Error("date fields not visible");
                console.log('clicking to show advanced search form ' + `(${tries})`);
                await wait(3);
                await clickByExpath(`//button[contains(@onclick, 'mostrar_ocultar_busqueda_avanzada')]`);
                await wait(2);
                console.log('waiting for date fields to be visible');
            } while (!await dateInputIsVisible());

            console.log('typing date fields');
            await clickAndType('fec_desde', desde);
            await clickAndType('fec_hasta', hasta);
            // await page.screenshot({path: __dirname + '/../pdf/page.png', fullPage: true});
            console.log('clicking search button');
            //all buttons have the same onclick, whichever is clicked it will work
            await clickByExpath(`//button[contains(@onclick, 'btn_buscar_componente_busqueda_avanzada_click')]`);
            await wait(15);
            await page.waitForSelector("#panel_resultados_busqueda_sentencias, #resultados_busqueda_registros_por_pagina",
                { visible: true, timeout: 75000 });
            // await page.screenshot({path: __dirname + '/../pdf/results.png', fullPage: true});
            // check how many results per page, if not 60, set it to 60
            let selectId = "resultados_busqueda_registros_por_pagina";
            //get select value
            let selectValue = await getSelectValue(selectId)
            console.log('selectValue', selectValue);
            //Get largest page size, it's 60 for Corte Suprema, but different for others
            pageSize = await getLargestPageSize(pageSize);
            if (selectValue !== `${pageSize}`) {
                //change select value to max page size
                console.log('changing select #' + selectId + ' value to', pageSize);
                await page.select(`#${selectId}`, `${pageSize}`);
                selectValue = await getSelectValue(selectId)
                console.log('selectValue', selectValue);
                //wait for page to reload
                await page.waitForNavigation({ timeout: 30000 }).catch(e => console.error(e));
                await page.waitForSelector("#panel_resultados_busqueda_sentencias", { visible: true, timeout: 75000 });

                // await page.screenshot({path: __dirname + '/../pdf/results-60.png', fullPage: true});
            }
            // handle pagination
            if (selectValue == `${pageSize}` && pageNo > 1) {
                let pageXpath = `//div[@id='capa_botones_paginas']//a[contains(text(),'${pageNo}')]`;
                //click on page number
                await clickByExpath(pageXpath);
                await page.waitForNavigation({ timeout: 30000 }).catch(e => {
                    // console.error(e)
                });
                await page.waitForSelector("#panel_resultados_busqueda_sentencias", { visible: true, timeout: 75000 });
            }

        } catch (e) {
            console.error("inner try catch", e);
            let filename = __dirname + '/../pdf/error-' + moment().format("YYYY-MM-DD HH_mm_ss");
            await page.screenshot({ path: filename + '.png', fullPage: true });
            html = await page.evaluate(() => document.documentElement.outerHTML);
            fs.writeFileSync(filename + '.html', html);
        }
        // await page.click('.btn_buscar');
        html = await page.evaluate(() => document.documentElement.outerHTML);
        // console.log(html);
        // const $ = load(html);
        // $('script').remove();
        // fs.writeFileSync(__dirname + "/../pdf/search.html", $.html());
        // console.log('saved search.html');
    } catch (e) {
        console.error('run failed', e);
    } finally {
        await browser?.close();
        console.log('browser closed');
    }
    //check that at least one of the responses has the same dates, page as the canonical url, and per page is 60
    let countValid = 0;
    let returnableResponses = [];
    for (let i = 0; i < responses.length; i++) {
        let response = responses[i];
        let canonicalURL = response.canonicalURL;
        let match = canonicalURL.match(/&from=(.*)&to=(.*)&pageSize=(\d+)(&page=(\d+))?/);
        if (!match) continue;
        let _desde = match[1];
        let _hasta = match[2];
        let perPage = parseInt(match[3]);
        let _page = match[5] && parseInt(match[5]) || 1;
        if (_desde === desde && _hasta === hasta && perPage === pageSize && pageNo === _page) {
            countValid++;
        }
        if (_page === pageNo) {
            returnableResponses.push(response);
        }
    }
    if (countValid === 0) {
        throw ('no valid responses: ' + canonicalURL);
        // return;
    }
    // let html = await page.content();
    // let resp = {responses, html}
    // return simpleResponse({canonicalURL, responseBody: JSON.stringify(resp, null, 1), mimeType: 'application/json'});
    return returnableResponses;
}

const dateInputIsVisible = async function () {
    let isVisible = false;
    try {
        await page.waitForSelector('#fec_desde', { visible: true, timeout: 1000 });
        isVisible = true;
    } catch (e) {
        console.error("date Input Is Not Visible");
    }
    return isVisible;
};

const getSelectValue = async function (selectId) {
    return await page.evaluate((selectId) => {
        let select = document.getElementById(selectId);
        return select.options[select.selectedIndex].value;
    }, selectId);
};

// write async function to wait for given number of seconds
const wait = async function (seconds) {
    await page.waitForTimeout(seconds * 1000);
}

const clickByExpath = async function (xPath, last = false) {
    const elements = await page.$x(xPath);
    console.log(`Found ${elements.length} elements with the xPath: ${xPath}`);
    // if (elements.length > 0) {
    let index = last ? elements.length - 1 : 0;
    elements[index].click();
    // }
};

const clickAndType = async function (id, text) {
    await page.focus(`#${id}`);
    await page.$eval('#' + id, (e, value) => e.setAttribute("value", value), text);
};

async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/[\?&]from=([^&]+)&to=([^&]+)(&pageSize=(\d+)&page=(\d+))?/i);
    const idMatch = canonicalURL.match(/\?k=(.+)$/i);

    if (match) {
        let desde = match[1];
        let hasta = match[2];
        let pageSize = match[4] ? parseInt(match[4]) : 60;
        let pageNo = match[5] ? parseInt(match[5]) : 1;
        return [await search({ canonicalURL, headers })]

    } else if (idMatch) {
        return [await openDoc({ canonicalURL, headers })];
    } else {
        throw new Error("Invalid URL: " + canonicalURL);
    }
}


// const test = async function () {
//     let responses = await fetchURL({
//         canonicalURL: 'https://juris.pjud.cl/busqueda?Sentencias_Penales&from=2023-11-21&to=2023-11-21&pageSize=60&page=1',
//         headers: {}
//     });
//     // openDoc({
//     //     canonicalURL: "https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=NER3Tm5qOXJNdEw4eGVsMmplenRLQT09",
//     //     headers: {}
//     // });
//
// };
//
// if (require.main == module) {
//     {
//         test();
//     }
// }

const testCrawler = async function () {
    let canonicalURLs = [`https://juris.pjud.cl/busqueda?Sentencias_Penales&from=2023-11-21&to=2023-11-21&pageSize=60&page=1`];
    let headers = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15" };
    // const fs = require("fs");
    for (let i = 0; i < canonicalURLs.length; i++) {
        let canonicalURL = canonicalURLs[i];
        let responses = await fetchURL({ canonicalURL, headers });
        for (let i = 0; i < responses.length; i++) {
            let responsePage = responses[i];
            let fileName = responsePage.canonicalURL.replace(/.+[\/?]([^?\/]+)$/i, "$1").replace(/\W/ig, "_");
            let type = responsePage.response.headers.get('content-type');
            let ext = /json/i.test(type) ? "json" : /pdf/i.test(type) ? "pdf" : /\.openxmlformats.*word/i.test(type) ? "docx" : /word/i.test(type) ? "doc" : "html";
            let filePath = `${__dirname}/../pdf/${fileName}.${ext}`;
            let html = await responsePage.response.buffer();
            fs.writeFileSync(filePath, html);
            console.log(`saved file to ${filePath}`);
        }
    }

};

testCrawler();
