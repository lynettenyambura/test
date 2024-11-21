// const puppeteer = require('puppeteer-core');
// const auth = 'brd-customer-hl_c6129ab6-zone-scraping_browser1:j6x7j107kgpw';
// const fs = require("fs");
// const moment = require("moment");
// const cheerio = require("cheerio");

import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import path from 'path';
import moment from 'moment';
import { load } from 'cheerio';
const auth = 'brd-customer-hl_c6129ab6-zone-scraping_browser1:j6x7j107kgpw';


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
        await page.waitForNavigation({ timeout: 30000 }).catch(e => {
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
        // console.log('error', e);
        failed = e;
    } finally {
        await closeBrowser();
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


async function closeBrowser() {
    try {
        //remove all listeners from page
        await page?.removeAllListeners();
    } catch (e) {
        console.error("Could not remove all listeners", e);
    }
    try {
        await page?.close();
    } catch (e) {
        console.error("Could not close page", e);
    }
    try {
        await browser?.close();
    } catch (e) {
        console.error("Could not close browser", e);
    }
    console.log("Browser closed");
}

const getPage = async function () {
    browser = await puppeteer.connect({
        browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`,
    });
    browser.on
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


const PaginationUtils = {
    getPagesShown: async function (maxPage = 0) {
        let html = await page.content();
        let $ = load(html);
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
                page: maxPage || -1,
                selector: "#btnPaginador_fin"
            }
        }
        paginationObj.getPages = function () {
            let pages = Object.keys(this.pages).map(x => x.page);

            [paginationObj.first, paginationObj.beforeFirstShown, paginationObj.afterLastShown, paginationObj.last].forEach(x => {
                Number.isFinite(x?.page) && pages.push(x.page);
            });
            //filter unique pages only
            pages = pages.filter((x, i) => pages.indexOf(x) === i);
            //sort pages in increasing order
            pages = pages.sort((a, b) => a - b);
        };
        return paginationObj;
    },
    isPageNumberShown: async function (pageNumber) {
        let paginationObj = await this.getPagesShown();
        // pages in next or previous are not shown
        return !!paginationObj.pages[pageNumber];
    },
    getCurrentPage: async function () {
        let html = await page.content();
        let $ = load(html);
        let pageLinks = $("#capa_botones_paginas a[style*='color']").toArray().map(x => {
            let a = $(x);
            let label = a.text().trim();
            let pageNumber = parseInt(label);
            return pageNumber;
        }).filter(x => x);
        return pageLinks.length && pageLinks[0] || 0;
    },
    isPageLoaded: async function (pageNumber) {
        let currentPage = await this.getCurrentPage();
        return currentPage === pageNumber;
    },
    getLargestPageSize: async function (pageSize) {
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
    },
    loadPage: async function ({ pageNumber, verifyLoaded = false, selector, xSelector }) {
        console.log('loadPage ->', pageNumber);
        let currentPage = await this.getCurrentPage();
        if (currentPage === pageNumber) {
            return true;
        }
        //click on page number
        if (xSelector)
            await clickByExpath(xSelector);
        else if (selector)
            await page.click(selector);
        else
            throw new Error('selector or xSelector must be provided');
        await page.waitForNavigation({ timeout: 30000 }).catch(e => {
            // console.error(e)
        });
        await page.waitForSelector("#panel_resultados_busqueda_sentencias", { visible: true, timeout: 75000 });
        if (verifyLoaded) {
            return pageNumber === await this.getCurrentPage();
        }
        return true;
    },
    navigateToPage: async function ({ pageNumber, xSelector }) {
        console.log('navigateToPage -->', pageNumber);
        let isPageShown = await this.isPageNumberShown(pageNumber);
        if (isPageShown) {
            //click page, ensure page is loaded
            return await this.loadPage({ pageNumber, verifyLoaded: true, xSelector: xSelector });
        } else {
            //get all displayed page numbers
            let paginationObj = await this.getPagesShown();
            // let pages = paginationObj.getPages();
            while (!isPageShown) {
                //click max page, then click next page
                let maxPage = Math.max(...Object.keys(paginationObj.pages));
                await this.loadPage({
                    pageNumber: maxPage,
                    verifyLoaded: false,
                    selector: paginationObj.pages[maxPage].selector,
                    xSelector: paginationObj.pages[maxPage].xselector
                });
                let nextPageLoaded = await this.loadPage({
                    pageNumber: paginationObj.afterLastShown.page,
                    verifyLoaded: true,
                    xSelector: paginationObj.afterLastShown.xselector,
                    selector: paginationObj.afterLastShown.selector
                });
                if (!nextPageLoaded) {
                    throw new Error('next page not loaded: ' + JSON.stringify(paginationObj.afterLastShown));
                }
                isPageShown = await this.isPageNumberShown(pageNumber);
                paginationObj = await this.getPagesShown();
            }
            return await this.loadPage({ pageNumber, verifyLoaded: true, xSelector: xSelector });
        }
    }
}

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
                        responseBody: text,
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
            await wait(2);
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
                { visible: true, timeout: 30000 });
            // await page.screenshot({path: __dirname + '/../pdf/results.png', fullPage: true});
            // check how many results per page, if not 60, set it to 60
            let selectId = "resultados_busqueda_registros_por_pagina";
            //get select value
            let selectValue = await getSelectValue(selectId)
            console.log('selectValue', selectValue);
            //Get largest page size, it's 60 for Corte Suprema, but different for others
            pageSize = pageNo === 1 ? await PaginationUtils.getLargestPageSize(pageSize) : pageSize;
            if (selectValue !== `${pageSize}`) {
                //change select value to max page size
                console.log('changing select #' + selectId + ' value to', pageSize);
                await page.select(`#${selectId}`, `${pageSize}`);
                selectValue = await getSelectValue(selectId)
                console.log('selectValue', selectValue);
                //wait for page to reload
                await page.waitForNavigation({ timeout: 30000 }).catch(e => {
                    // console.error(e)
                });
                await page.waitForSelector("#panel_resultados_busqueda_sentencias", { visible: true, timeout: 75000 });

                // await page.screenshot({path: __dirname + '/../pdf/results-60.png', fullPage: true});
            }
            // handle pagination
            if (selectValue == `${pageSize}` && pageNo > 1) {
                let pageXpath = `//div[@id='capa_botones_paginas']//a[contains(text(),'${pageNo}')]`;
                await PaginationUtils.navigateToPage({ pageNumber: pageNo, xSelector: pageXpath });
            }

        } catch (e) {
            console.error("inner try catch", e);
            let filename = __dirname + '/../pdf/error-' + moment().format("YYYY-MM-DD HH_mm_ss");
            // await page.screenshot({path: filename + '.png', fullPage: true});
            html = await page.evaluate(() => document.documentElement.outerHTML);
            // fs.writeFileSync(filename + '.html', html);
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
        await closeBrowser();
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
        return await search({ canonicalURL, headers });

    } else if (idMatch) {
        return [await openDoc({ canonicalURL, headers })];
    } else {
        throw new Error("Invalid URL: " + canonicalURL);
    }
}


const testCrawler = async function () {
    // let canonicalURLs = [`https://juris.pjud.cl/busqueda?Sentencias_Penales&from=2023-11-01&to=2023-11-14&pageSize=10&page=6`];
    let canonicalURLs = [`https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=a1piZ3BuMWo2aC9SVHNsUGtiT3VPMGQ2TmF0MWF6KytGZWlQYkVreXNqMD0=`];
    // let canonicalURLs = [`https://juris.pjud.cl/busqueda?Buscador_Jurisprudencial_de_la_Corte_Suprema&from=2023-11-01&to=2023-11-14&pageSize=20&page=1`];
    let headers = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15" };
    // const fs = require("fs");
    for (let i = 0; i < canonicalURLs.length; i++) {
        let canonicalURL = canonicalURLs[i];
        let responses = await fetchURL({ canonicalURL, headers });
        for (let i = 0; i < responses.length; i++) {
            let responsePage = responses[i];
            let fileName = responsePage.canonicalURL.replace(/.+[\/?]([^?\/]+)$/i, "$1").replace(/\W/ig, "_");
            let type = responsePage.mimeType || responsePage.response.headers.get('content-type');
            let ext = /json/i.test(type) ? "json" : /pdf/i.test(type) ? "pdf" : /\.openxmlformats.*word/i.test(type) ? "docx" : /word/i.test(type) ? "doc" : "html";
            let filePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../pdf', `${fileName}.${ext}`);

            // let filePath = `${__dirname}/../pdf/${fileName}.${ext}`;
            let html = responsePage.responseBody || await responsePage.response.buffer();
            fs.writeFileSync(filePath, html);
            console.log(`saved file to ${filePath}`);
        }
    }

};

testCrawler();
