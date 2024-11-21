"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const userAgent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36";
const url = require("url");
let browser = null;


const init = async function () {
    if (browser) {
        console.log("Browser already initialized");
        return;
    }
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        `--user-agent=${userAgent}`,
        // '--proxy-server=zproxy.lum-superproxy.io:22225'
    ];
    const options = {
        args,
        headless: false,
        ignoreHTTPSErrors: true,
        // userDataDir: './tmp',
    };

    browser = await puppeteer.launch(options);
};

exports.newPage = async () => {
    await init();
    const page = await browser.newPage();
    // await page.authenticate({username: "lum-customer-vlex-zone-g1-country-us", password: "003c65247594"});
    return page;
};

exports.getBrowser = async () => {
    if (!browser)
        return await init();
    return browser;
}
