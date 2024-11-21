"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parsePage({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const $ = cheerio.load(responseBody.content, {decodeEntities: false});
    $('[data-gx-evt-control] a').each(function (i) {
        let a = $(this);
        console.log(i, a.text().replace(/\s+/g, " ").trim());
    });
    return [];

}
function parsePageFetch({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const $ = cheerio.load(responseBody.content, {decodeEntities: false});
    const results = [];
    const form = {};
    let state = null;
    $("form").find("input, textarea, select").toArray().forEach((input, index) => {
        input = $(input);
        let name = input.attr('name');
        if (!name) return;
        let value = input.val() || "";
        if (/GridContainerDataV/i.test(name)) {
        } else if (/GXState/i.test(name)) {
            state = value;
            value = JSON.parse(value);
            // value.forEach(a => {
            //     // console.log(JSON.stringify(a, null, 4));
            // })
            for (let field in value) {
                console.log(field + " : state-field");
                if (/GridContainerData/i.test(field)) {
                    let o = JSON.parse(value[field]);
                    for (let f in o) {
                        //if f is numeric, check object Props for 2 element array with vN...f+1, and value
                        if (/^\d+$/i.test(f)) {
                            o[f].Props.forEach(ar => {
                                if (ar.length >= 2 && /^v(AN|NR)OSENTENCIA_\d+$/i.test(ar[0])) {
                                    form[ar[0]] = ar[1];
                                }
                            })
                        }
                    }
                }
            }
        } else {
            form[name] = value;
        }
    });
    state && (form.GXState = state);
    // results.push(form);
    return results;
}

const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/../pdf/2017-2018.html");
    buffer = parsePage({
        responseBody: {content: buffer.toString(), buffer, fileFormat: "text/html"},
        URL: "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses",
        referer: "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
