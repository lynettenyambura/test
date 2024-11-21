"use strict";

const querystring = require("querystring");


const moment = require('moment');
const url = require('url');
const cheerio = require('cheerio');

function setSharedVariable(key, value) {
    ma[key] = value;
}

function getSharedVariable(key) {
    return ma[key];
}


async function fetchPage({canonicalURL, requestURL, requestOptions, headers}) {
    if (!requestOptions) requestOptions = {method: "GET", headers};
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({URL: requestURL}, requestOptions),
                response
            };
        });
}

const parseForm = async function (responsePage) {
    let html = await responsePage.response.text();
    let $ = cheerio.load(html);
    const form = {};
    $("input, select, textarea").each(function (i, input) {
        input = $(input);
        let name = input.attr("name");
        let value = input.val() || "";
        if (name) form[name] = value;
    });
    responsePage.response = new fetch.Response(html, responsePage.response);
    return form;
};

const getHome = async function ({headers}) {
    let customHeaders = {
        "Upgrade-Insecure-Requests": "1",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = {method, headers: _headers};
    let requestURL = 'https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx';
    let responsePage = await fetchPage({requestURL, requestOptions});
    let form = await parseForm(responsePage);
    setSharedVariable("homeForm", form);
    return responsePage;
};


const searchAll = async function ({canonicalURL, headers}) {
    console.log("Searching first Page: ");
    let customHeaders = {
        "Origin": "https://secure.dlca.vi.gov",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "max-age=0",
        "Referer": "https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    let form = getSharedVariable("homeForm");
    let body = querystring.stringify({
        "__LASTFOCUS": "",
        "__EVENTTARGET": "",
        "__EVENTARGUMENT": "",
        "__VIEWSTATE": form['__VIEWSTATE'],
        "__VIEWSTATEGENERATOR": form['__VIEWSTATE'],
        "__VIEWSTATEENCRYPTED": "",
        "ctl00$top$LicSearchcontrol$txtName": "",
        "ctl00$top$LicSearchcontrol$txtLicNo": "",
        "ctl00$top$LicSearchcontrol$txtAddress": "",
        "ctl00$top$LicSearchcontrol$selIsland": "ALL",
        "ctl00$top$LicSearchcontrol$txtLictype": "",
        "ctl00$top$LicSearchcontrol$txtbusAct": "",
        "ctl00$top$LicSearchcontrol$btnsearch": "Search",
        "ctl00$top$LicSearchcontrol$hdnRowIndex": "",
        "ctl00$top$LicSearchcontrol$hdnBusseq": "",
        "ctl00$top$LicSearchcontrol$hdnPgIndex": "1",
        "ctl00$top$LicSearchcontrol$hdnSortBy": "",
        "ctl00$top$LicSearchcontrol$hdnExport": "",
        "hiddenInputToUpdateATBuffer_CommonToolkitScripts": "1"
    });
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions});
    form = await parseForm(responsePage);
    setSharedVariable("homeForm", form);
    //identify pages, inject pagination URL's
    let html = await responsePage.response.text();
    const $ = cheerio.load(html);
    let paginationText = $("span.RecCount:contains('Records')").first().text().replace(/\s+/g, " ").trim();
    let max = parseInt(/.+\s+(\d+)$/.exec(paginationText)[1]);
    let pages = Math.ceil(max / 10);
    $("body").append("<div id='injected_links'><h2>Injected Links</h2></div>");
    for (let i = 2; i <= pages; i++) {
        $(`div#injected_links`).append(`<a href="https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx?page=${i}">${i}</a> ${(i + 2) % 20 === 0 ? "<br/>" : "0"}`)
        if (i % 100 === 0)
            $(`div#injected_links`).append(`<br><h3>The next 100</h3><br>`)

    }
    responsePage.response = new fetch.Response($.html(), responsePage.response);
    return responsePage;
};


const nextPage = async function ({page, canonicalURL, headers}) {
    console.log('Fetching page: ' + page);
    let customHeaders = {
        "Origin": "https://secure.dlca.vi.gov",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "max-age=0",
        "Referer": "https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    let form = getSharedVariable("homeForm");
    let body = querystring.stringify({
        "__LASTFOCUS": "",
        "__EVENTTARGET": "ctl00$top$LicSearchcontrol$btnNext",
        "__EVENTARGUMENT": "",
        "__VIEWSTATE": form['__VIEWSTATE'],
        "__VIEWSTATEGENERATOR": form['__VIEWSTATE'],
        "__VIEWSTATEENCRYPTED": "",
        "ctl00$top$LicSearchcontrol$txtName": "",
        "ctl00$top$LicSearchcontrol$txtLicNo": "",
        "ctl00$top$LicSearchcontrol$txtAddress": "",
        "ctl00$top$LicSearchcontrol$selIsland": "ALL",
        "ctl00$top$LicSearchcontrol$txtLictype": "",
        "ctl00$top$LicSearchcontrol$txtbusAct": "",
        "ctl00$top$LicSearchcontrol$hdnRowIndex": "",
        "ctl00$top$LicSearchcontrol$hdnBusseq": "",
        "ctl00$top$LicSearchcontrol$hdnPgIndex": page - 1,
        "ctl00$top$LicSearchcontrol$hdnSortBy": "",
        "ctl00$top$LicSearchcontrol$hdnExport": "",
        "hiddenInputToUpdateATBuffer_CommonToolkitScripts": "1"
    });
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions});
    form = await parseForm(responsePage);
    setSharedVariable("homeForm", form);
    return responsePage;
};

async function fetchURL({canonicalURL, headers}) {
    const match = canonicalURL.match(/.+License_search.aspx$/i);
    const paginationMatch = canonicalURL.match(/.+License_search.aspx\?page=(\d+)$/i);
    if (match) {
        let homeResponse = await getHome({headers});
        let searchPage1 = await searchAll({canonicalURL: canonicalURL + "?page=1", headers});
        return [homeResponse, searchPage1]
    } else if (paginationMatch) {
        let page = await nextPage({page: parseInt(paginationMatch[1]), headers, canonicalURL});
        return [page]
    } else {
        console.error("UnExpected URL: " + canonicalURL);
        // return defaultFetchURL({canonicalURL, headers});
    }
}