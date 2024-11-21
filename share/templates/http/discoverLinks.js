"use strict";

const url = require("url");
const cheerio = require("cheerio");
const querystring = require("querystring");
const moment = require("moment");
const mkdirp = require("mkdirp");

function discoverLinks({content, contentType, canonicalURL, requestURL}) {
    let links = [];
    if (/html/i.test(contentType)) {
        const $ = cheerio.load(content);
        $("a[href]").each(function () {
            let href = $(this).attr('href');
            href = href ? url.resolve(requestURL, href) : null;
            if (href)
                links.push(href)
        })

    }//alternative content types in own else if blocks
    return links;

}


const testFunction = function () {
    mkdirp.sync("../pdf");
    let content = require("fs").readFileSync(__dirname + "/../pdf/FILE.html");//Point to real file
    let contentType = "html";
    let canonicalURL = "";//PROVIDE URL
    let requestURL = "" || canonicalURL;

    let links = discoverLinks({content, contentType, requestURL, canonicalURL});
    console.log(JSON.stringify(links, null, 4));
    console.log(links.length + " links discovered");
};
testFunction();