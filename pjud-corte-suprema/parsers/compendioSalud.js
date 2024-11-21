"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parsePage({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    const j = JSON.parse(responseBody.content);
    const results = j?.response?.docs?.map(d => {
        const doc = {URI: [], title: null, date: null, ...d}
        for (let f in doc) {
            if (/^text/i.test(f) && doc[f]) {
                doc[f] = {
                    content: doc[f], fileFormat: "text/html", locale: 'es-CL'
                };
            }
        }
        doc.url_accesso_sentencia && doc.URI.push(doc.url_accesso_sentencia);
        doc.url_corta_acceso_sentencia && doc.URI.push(doc.url_corta_acceso_sentencia);
        doc.custom_pdf_url && doc.URI.push(doc.custom_pdf_url);
        return doc;
    }) || [];


    return results.filter(d=>d.URI.length);
}

const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/../pdf/compendio1.json");
    buffer = parsePage({
        responseBody: {content: buffer.toString(), buffer, fileFormat: "text/html"},
        URL: "https://juris.pjud.cl/busqueda?Compendio_de_Salud_Corte_de_Apelaciones&from=2013-01-01&to=2023-10-19",
        referer: "https://juris.pjud.cl/busqueda?Compendio_de_Salud_Corte_de_Apelaciones&from=2013-01-01&to=2023-10-19",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
