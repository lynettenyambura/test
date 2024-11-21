"use strict";

// const csv = require("csv-parse/sync");
// const fs = require("fs");

import { parse } from "csv-parse/sync";
import fs from 'fs';
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
let pathToCSV = path.join(__dirname, 'pdf', 'chile-tipos.csv')

// let pathToCSV = __dirname + `/pdf/chile-tipos.csv`;
let icbgCsv = fs.readFileSync(pathToCSV);

let cats = new Set();
let courts = new Set();
let URIs = parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).forEach(d => {
    // d.court && courts.add(d.court);
    d.Tipo && cats.add(d.Tipo);
});

//write cats to cats.txt, each on a new line
// fs.writeFileSync(__dirname + `/pdf/chile-tipos.txt`, [...cats].sort().join("\n"));
fs.writeFileSync(path.join(__dirname, 'pdf', 'chile-tipos.txt'), [...cats].sort().join("\n"));

//write courts to courts.txt, each on a new line
// fs.writeFileSync(__dirname + `/pdf/courts-v3.txt`, [...courts].sort().join("\n"));

