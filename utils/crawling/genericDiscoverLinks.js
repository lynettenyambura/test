"use strict";

// const cheerio = require("cheerio");
// const moment = require("moment");
// const url = require("url");
// const querystring = require("querystring");

import { load } from "cheerio";
import moment from "moment";
import url from 'url';
import querystring from 'querystring'

function discoverLinks({ content, contentType, canonicalURL, requestURL }) {
    const hrefs = [];
    if (/html/i.test(contentType)) {
        const $ = load(content, { decodeEntities: false });
        $("a[href]").each(function () {
            hrefs.push($(this).attr("href"));
        })
    }
    return hrefs;
}
