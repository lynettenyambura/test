"use strict";





const BASEURL = "https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx"

function getKey($, key) {
    if ($(`input[name="${key}"]`).prop("value")) {
        return $(`input[name="${key}"]`).prop("value") || "";
    }
}

function addKeyToForm($, key, form) {
    if ($(`input[name="${key}"]`).prop("value")) {
        form.append(key, $(`input[name="${key}"]`).prop("value"));
    }
}

async function getPage({ canonicalURL, requestURL, requestOptions }) {

    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;

    let searchResponse = await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });

    return searchResponse;
}

async function getFirstFormParams(body) {
    let $ = cheerio.load(body);
    const requestParams = {
        __VIEWSTATE: getKey($, "__VIEWSTATE"),
        __EVENTTARGET: getKey($, "__EVENTTARGET"),
        __EVENTARGUMENT: getKey($, "__EVENTARGUMENT"),
        __VIEWSTATEGENERATOR: getKey($, "__VIEWSTATEGENERATOR"),
        ctl00$top$LicSearchcontrol$txtName: "",
        ctl00$top$LicSearchcontrol$txtLicNo: "",
        ctl00$top$LicSearchcontrol$txtAddress: "",
        ctl00$top$LicSearchcontrol$selIsland: "ALL",
        ctl00$top$LicSearchcontrol$txtLictype: "",
        ctl00$top$LicSearchcontrol$txtbusAct: "",
        ctl00$top$LicSearchcontrol$hdnRowIndex: "",
        ctl00$top$LicSearchcontrol$hdnBusseq: "",
        ctl00$top$LicSearchcontrol$hdnSortBy: "",
        ctl00$top$LicSearchcontrol$hdnExport: "",
        hiddenInputToUpdateATBuffer_CommonToolkitScripts: "1",
    }

    return requestParams
}

async function getHomeForm() {
    //fetch homepage first
    var requestURL = BASEURL;
    var requestOptions1 = {
        method: 'POST', headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "es,en;q=0.9,ca;q=0.8,en-US;q=0.7,ja;q=0.6",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Host": "secure.dlca.vi.gov",
            "Origin": "https://secure.dlca.vi.gov",
            "Referer": "https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
        }
    };
    var response = await fetchWithCookies(requestURL, requestOptions1);
    var body = await response.text();

    return await getFirstFormParams(body);
}

async function fetchURL({ canonicalURL, headers }) {
    let homeForm = await getHomeForm();

    let page;

    if (canonicalURL.match(/(?:\?|&)page=(\d+)/)) {
        page = parseInt(canonicalURL.match(/(?:\?|&)page=(\d+)/)[1])-1;
    }

    if (page) {
        //homeForm.append("ctl00$top$LicSearchcontrol$hdnPgIndex", page);
        homeForm.page = page;
    }

    let body = querystring.stringify(homeForm);

    console.log(homeForm);

    console.log("body:", body)

    var requestOptions = {
        method: 'POST', headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "es,en;q=0.9,ca;q=0.8,en-US;q=0.7,ja;q=0.6",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "secure.dlca.vi.gov",
            "Origin": "https://secure.dlca.vi.gov",
            "Referer": "https://secure.dlca.vi.gov/license/Asps/Search/License_search.aspx",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
        }, body
    };


    //page ctl00$top$LicSearchcontrol$hdnPgIndex
    return [await getPage({ canonicalURL, requestURL: canonicalURL, requestOptions })];
    //return [];

}