"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
// const url = require("url");
// const querystring = require("querystring");
const sanitizeHtml = (x) => x;

import moment from "moment";
import { load } from "cheerio";
import * as url from 'url'
import * as querystring from 'querystring';
import fs from 'fs';
import path from 'path';


function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let j = JSON.parse(responseBody.content);
    let doc = { URI: [URL] };
    let main = JSON.parse(j.responses.main.response);
    let data = main?.response?.docs?.length && main.response.docs[0];
    if (!data) {
        console.log(`parsePage: no data ${URL}`);
        return [];
    }
    doc.year = data.sent__FEC_ANIO_i;
    doc.docType = data.sent__GLS_TIPFALLADA_s;
    doc.judge = data.gls_juez_ss;
    doc.juzgado = data.gls_juz_s;
    doc.rol = data.rol_era_sup_s;
    doc.caratulado = data.caratulado_s;
    doc.ruc = data.sent__RUC_s;
    doc.materias = data.cod_materia_s;
    let d = moment(data.fec_sentencia_sup_dt);
    doc.date = d.isValid() ? d.format("YYYY-MM-DD") : null;
    doc.dateOriginal = data.fec_sentencia_sup_dt;
    doc.summary = data.texto_sentencia_preview && load(data.texto_sentencia_preview).text().replace(/\s+/g, " ").trim();
    doc.html_content = data.texto_sentencia && {
        content: data.texto_sentencia,
        locale: "es",
        dataType: "MEDIA",
        fileFormat: "text/html"
    };
    doc.text_content = data.texto_sentencia_anon && {
        content: data.texto_sentencia_anon,
        locale: "es",
        dataType: "MEDIA",
        fileFormat: "text/plain"
    };
    ['url_corta_acceso_sentencia', 'url_acceso_sentencia'].forEach(u => {
        if (!doc.URI.includes(data[u])) {
            doc.URI.push(data[u])
        }
    })
    return [doc]
}

const parserTest = function () {
    // const fs = require("fs");
    const filePath = path.join(path.dirname(new URL(import.meta.url).pathname), '/../pdf/familia1.json');
    // let buffer = fs.readFileSync(__dirname + "/../pdf/familia1.json");
    let buffer = fs.readFileSync(filePath)
    buffer = parsePage({
        responseBody: { content: buffer.toString(), buffer, fileFormat: "application/json" },
        URL: "https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=OTVqeDV3ZkQwaVpPV3V3MUU1Rm9zZ2VwOHNGd0NhTnpWS2gzWmx4MUtUWT0=",
        referer: "https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=OTVqeDV3ZkQwaVpPV3V3MUU1Rm9zZ2VwOHNGd0NhTnpWS2gzWmx4MUtUWT0=",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
