"use strict";

const url = require("url");
const cheerio = require("cheerio");
const querystring = require("querystring");
const moment = require("moment");


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

    } else if (/json/i.test(contentType)) {
        const json = JSON.parse(content);
        if (/&(date|start|from)=[\d\-]+/i.test(canonicalURL)) {
            const baseURL = canonicalURL.replace(/&page=.*/i, "");
            const count = json?.response?.numFound || 0;
            const pageSize = 50;
            const pages = Math.ceil(count / pageSize);
            for (let page = 2; page <= pages; page++) {
                const pageURL = baseURL + "&page=" + page;
                links.push(pageURL);
            }
        }
        const docs = json?.response?.docs || Array.isArray(json) && json || [];
        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            doc.custom_pdf_url && links.push(doc.custom_pdf_url);
            doc.id && links.push(`https://juris.pjud.cl/busqueda?Buscador_Jurisprudencial_de_la_Corte_Suprema&id=${doc.id}`);
        }
    }
    return links;
}


const testFunction = function () {
    let content = require("fs").readFileSync(__dirname + "/../pdf/json.json");
    let contentType = "json";
    // let canonicalURL = "https://juris.pjud.cl/busqueda?Buscador_Jurisprudencial_de_la_Corte_Suprema&date=2023-10-09";
    let canonicalURL = "https://juris.pjud.cl/busqueda?Compendio_de_Salud_Corte_de_Apelaciones&from=2013-01-01&to=2023-10-19";
    let requestURL = "" || canonicalURL;

    let links = discoverLinks({content, contentType, requestURL, canonicalURL});
    console.log(JSON.stringify(links, null, 4));
    console.log(links.length + " links discovered");
};
testFunction();
