"use strict";

const csv = require("csv-parse/sync");
const fs = require("fs");

let pathToCSV = __dirname + `/pdf/dp0190-2.csv`;
let icbgCsv = fs.readFileSync(pathToCSV);

let cats = new Set();
let courts = new Set();
let URIs = csv.parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).forEach(d => {
   d.court && courts.add(d.court);
   d.cat_juicio && cats.add(d.cat_juicio);
});

//write cats to cats.txt, each on a new line
fs.writeFileSync(__dirname + `/pdf/cats.txt`, [...cats].sort().join("\n"));
//write courts to courts.txt, each on a new line
fs.writeFileSync(__dirname + `/pdf/courts-v3.txt`, [...courts].sort().join("\n"));

