"use strict";

// const url = require("url");
// const cheerio = require("cheerio");
// const querystring = require("querystring");
// const moment = require("moment");

import * as url from 'url';
import { load } from 'cheerio';
import * as querystring from 'querystring';
import * as fs from 'fs'
import moment from 'moment';
import path from 'path';



function discoverLinks({ content, contentType, canonicalURL, requestURL }) {
    if (canonicalURL.indexOf("company") > 0) {
        return discoverLinksInCompanyIndexPage(content.toString()); // need to cast as string because it is received as a Buffer
    } else if (canonicalURL.indexOf(".txt") > 0) {
        return discoverLinksInFilingPage(content, requestURL);
    } else {
        return discoverLinksInDailyIndexPage(content);
    }
}

function discoverLinksInCompanyIndexPage(content) {
    // company pages index pages such as https://www.sec.gov/Archives/edgar/daily-index/2024/QTR1/company.20240216.idx
    // list the filings on a certain date for a company
    //
    // we are looking for lines that look like
    //
    // 1ST SOURCE CORP                                               10-k           34782       20240102    edgar/data/34782/0000034782-24-000004.txt
    //
    // we filter lines making references to 8-K and 10-K and then locate any path on that line

    const matchingLines = content.split("\n").filter(l => l.match(/8-K|10-K/i))
    return matchingLines.map(extractURLInRawLine).filter(x => x);
}

function discoverLinksInFilingPage(content, requestURL) {
    // filing pages use Edgar's "Public Dissemination Service" format as documented in https://www.sec.gov/files/edgar/pds_dissemination_spec.pdf
    // the file is a composite of different documents
    //
    // see an example in: https://www.sec.gov/Archives/edgar/data/51434/0001193125-24-038566.txt
    //
    // sometimes the exhibits are inline to the PDS file (this is shown by a link that is relative  <a href='foo.html'>
    // in the main filing document)
    //
    // but the exhibits may be linked to another external file. If so we want to follow the links
    //
    // the logic here is simply: gather all links, filter only absolute links to the sec.gov and follow those
    const hrefs = [];
    const $ = load(content);

    $("a[href]").each(function () {
        const href = $(this).attr("href");
        // we only are interested in absolute links, because relative links are to documents in the same PDS file
        if (href.indexOf("http") == 0) {
            hrefs.push(href.replace("http://", "https://"));
        } else if (!/javascript|#/i.test(href)) console.log(`URL does not start with 'http': ${href}`);
    })

    // download images in the data, they can be resolved later in the content parser
    // example: https://vlex.icbg.io/#/w0/h3db8d1679846e684d07755e0027ea4fa8ab64c0613f49db71fbf2f9360307b95.N.b06s95ncwff4xd5?q=lastSuccessfulRequest.jobId%3Ab06s95ncwff4xd5
    // full link resolved here: https://www.sec.gov/Archives/edgar/data/814549/000119312524082751/0001193125-24-082751-index.htm

    // tag: <IMG SRC="g819319g0329230658656.jpg" ALT="LOGO">
    // absolute url:        https://www.sec.gov/Archives/edgar/data/814549/000119312524082751/g819319g0329230658656.jpg
    // url of current page: https://www.sec.gov/Archives/edgar/data/814549/0001193125-24-082751.txt

    // notes: remove '-' from txt url, and replace .txt extension with '/' to get image url resolution base
    let urlRoot = requestURL.replace(/[\-]/ig, "").replace(/\.txt/, "/");
    $("img[src]").each(function () {
        let src = $(this).attr("src");
        hrefs.push(url.resolve(urlRoot, src));
    });

    return hrefs;
}

function discoverLinksInDailyIndexPage(content) {
    // Daily index pages (https://www.sec.gov/Archives/edgar/daily-index/2024/QTR1/)
    // are just a simple HTML page that lists all the files under the folder
    const hrefs = [];
    const $ = load(content);

    $("a[href]").each(function () {
        hrefs.push($(this).attr("href"));
    })
    return hrefs;
}

function extractURLInRawLine(matchingLine) {
    /* matchingLine looks like

    1ST SOURCE CORP                                               4           34782       20240102    edgar/data/34782/0000034782-24-000004.txt
    */

    const edgarPathMatch = matchingLine.match(/edgar\/data.*\.txt/);

    if (edgarPathMatch) {
        return "https://www.sec.gov/Archives/" + edgarPathMatch[0];
    } else {
        return null;
    }
}


const testFunction = function () {
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const filePath = path.join(currentDir, '/../pdf/miss.txt');

    let content = fs.readFileSync(filePath, 'utf-8')
    // let content = require("fs").readFileSync(__dirname + "/../pdf/miss.txt");
    let contentType = "txt";
    // let canonicalURL = "https://www.sec.gov/Archives/edgar/data/814549/0001193125-24-082751.txt";
    let canonicalURL = "https://www.sec.gov/Archives/edgar/data/1037676/0001558370-24-001229.txt";
    let requestURL = "" || canonicalURL;

    let links = discoverLinks({ content, contentType, requestURL, canonicalURL });
    console.log(JSON.stringify(links, null, 4));
    console.log(links.length + " links discovered");
};
testFunction();
