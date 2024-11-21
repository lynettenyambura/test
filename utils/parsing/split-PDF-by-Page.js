"use strict";

// const moment = require("moment");
// const cheerio = require("cheerio");
// const url = require("url");
// const querystring = require("querystring");

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs';


async function splitPDF({ pdfURL, startPage = 1, endPage = 'end', locale }) {
  const URLId = "H" + new Buffer(pdfURL).toString("base64");
  const URLIdN = "H" + sha256(pdfURL) + ".N";
  const resp = await graphql(`
            query {
              nodes(ids: ["${URLId}", "${URLIdN}"]) {
                id
                ... on CrawledURL {
                  lastSuccessfulRequest {
                    outputForFilter(filter: "getPDFRange", arguments: {FROM: "${startPage}", TO: "${endPage}"})
                  }
                }
              }
            }`);
  const res = resp.nodes && (resp.nodes[0] || resp.nodes[1]);
  const transcodedMediaObject = res.lastSuccessfulRequest &&
    res.lastSuccessfulRequest.outputForFilter &&
    res.lastSuccessfulRequest.outputForFilter.length &&
    res.lastSuccessfulRequest.outputForFilter[0].filterOutput &&
    res.lastSuccessfulRequest.outputForFilter[0].filterOutput.transcodedMediaObject;
  //throw(JSON.stringify({resp},null, 3))
  if (transcodedMediaObject) {
    return {
      mediaObjectId: transcodedMediaObject.id,
      dataType: "MEDIA",
      locale
    };
  }
  return null;
}

const parserTest = function () {
  // const fs = require("fs");
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const filePath = path.join(currentDir, "/../pdf/.html");
  let buffer = fs.readFileSync(filePath)

  // let buffer = fs.readFileSync(__dirname + "/../pdf/.html");
  buffer = splitPDF({ responseBody: { content: buffer }, URL: "" });
  console.log(JSON.stringify(buffer, null, 4));
  console.log(buffer.length);
};
parserTest();
