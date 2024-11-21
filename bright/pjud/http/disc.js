"use strict";

// const url = require("url");
// const cheerio = require("cheerio");
// const querystring = require("querystring");
// const moment = require("moment");
import * as url from 'url';
import * as querystring from 'querystring';
import { load } from 'cheerio';
import * as fs from 'fs'
// import cheerio from 'cheerio';
import moment from "moment";
import path from 'path';


function discoverLinks({ content, contentType, canonicalURL, requestURL }) {
    let links = [];
    if (/html/i.test(contentType)) {
        const $ = load(content);
        $("a[href]").each(function () {
            let href = $(this).attr('href');
            href = href ? url.resolve(requestURL, href) : null;
            if (href)
                links.push(href)
        })

    } else if (/json/i.test(contentType)) {
        const parseDocs = function (docs) {
            docs?.forEach(doc => {
                if (doc?.url_acceso_sentencia) {
                    links.push(doc.url_acceso_sentencia);
                }
            })
        };
        const handlePages = function (total, perPage) {
            if (!total || !perPage) return;
            let totalPages = Math.ceil(total / perPage);
            let page = 1;
            let baseUrl = canonicalURL.replace(/&pageSize=.+/i, "");
            while (page <= totalPages) {
                let nextURL = `${baseUrl}&pageSize=${perPage}&page=${page}`;
                links.push(nextURL);
                page++;
            }
        };
        let json = null;
        try {
            json = JSON.parse(content);
        } catch (e) {
            console.log("Error parsing json for " + canonicalURL, e);
        }
        if (json?.response?.docs?.length) {
            parseDocs(json.response.docs);
        }
        json?.responses?.forEach(response => {
            if (response?.response?.body?.response?.docs?.length) {
                parseDocs(response.response.body.response.docs);
            }
            let numFound = response?.response?.body?.response?.numFound;
            let pageSize = response?.response?.body?.responseHeader?.params?.rows || 0;
            let params = response?.canonicalURL && querystring.parse(response?.canonicalURL?.substring(response?.canonicalURL?.indexOf('?') + 1)) || {};
            params.from && handlePages(numFound, pageSize);
        })
        //pages
        if (json?.response?.numFound) {
            let params = querystring.parse(canonicalURL.substring(canonicalURL.indexOf('?') + 1));
            let pageSize = json?.responseHeader?.params?.rows || params.pageSize || 60;
            handlePages(json.response.numFound, pageSize);
        }

    }
    return links;
}


const testFunction = function () {
    let currentDir = path.dirname(new URL(import.meta.url).pathname);
    const jsonFilePath = path.join(currentDir, '/../pdf/Sentencias_Penales_from__to__pageSize_10.json');
    let content = fs.readFileSync(jsonFilePath, 'utf-8')
    // let content = require("fs").readFileSync(__dirname + "/../pdf/Sentencias_Penales_from__to__pageSize_10.json");
    let contentType = "json";
    let canonicalURL = "https://juris.pjud.cl/busqueda?Buscador_Jurisprudencial_de_la_Corte_Suprema&from=2019-01-01&to=2019-12-31&pageSize=60&page=2";
    let requestURL = "" || canonicalURL;

    let links = discoverLinks({ content, contentType, requestURL, canonicalURL });
    console.log(JSON.stringify(links, null, 4));
    console.log(links.length + " links discovered");
};
testFunction();
