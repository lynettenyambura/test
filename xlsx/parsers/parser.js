"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parseXLSX({sharedStrings, sheet}) {
    let sharedStringsArray = parseSharedString(sharedStrings);
    const $ = cheerio.load(sheet, {xmlMode: !false});
    // console.log($("c[r='D2']").length);
    let rows = [];

    $("sheetData>row").each(function (i) {
        let row = $(this);
        if (row.attr('hidden')) {
            return;
        }
        // let rowNumber = row.attr("r"); // 1 based
        // if (rowNumber === "2") {
        //     console.log("row", rowNumber);
        // }
        let rowCells = {};
        row.find(">c").each(function (j) {
            let cell = $(this);
            let type = cell.attr("t");
            let span = cell.attr("s");
            let value = cell.find(">v").text();
            let number = cell.attr("r");
            let cellData = {
                // r: number,
                value,
                // t: type,
                // s: span,
            }
            if (type === "s") {
                cellData.value = sharedStringsArray[parseInt(value)];
            } else if (span === "5") {
                cellData.value = convertXlsxIndexToDate(value);
            }
            cellData.value && (rowCells[number] = cellData);
        });
        rows.push(rowCells);
    });
    return rows;
}

const convertXlsxIndexToDate = function (index) {
    if (!Number.isFinite(index))
        index = parseInt(index);
    let date = moment("1900-01-01").add(index - 2, "days");
    return date.format("YYYY-MM-DD");
};

const parseSharedString = function (sharedStrings) {
    const $ = cheerio.load(sharedStrings, {decodeEntities: false});
    let results = [];
    $("si").each((i, elem) => {
        let text = $(elem).find("t").text();
        results.push(text);
    });
    return results;
}

const parserTest = function () {
    const fs = require("fs");
    let sharedStrings = fs.readFileSync("C:\\Users\\Tindase\\Downloads\\david\\xl\\sharedStrings.xml").toString();
    let workbook = fs.readFileSync("C:\\Users\\Tindase\\Downloads\\david\\xl\\workbook.xml").toString();
    let sheet1 = fs.readFileSync("C:\\Users\\Tindase\\Downloads\\david\\xl\\worksheets\\sheet1.xml").toString();
    let sheet2 = fs.readFileSync("C:\\Users\\Tindase\\Downloads\\david\\xl\\worksheets\\sheet2.xml").toString();

    // console.log("sharedStrings", parseSharedString(sharedStrings));
    // console.log(44652, '->', convertXlsxIndexToDate(44652));
    let transformedSheet1 = parseXLSX({sharedStrings, sheet: sheet1});
    let transformedSheet2 = parseXLSX({sharedStrings, sheet: sheet2});
    console.log(JSON.stringify(transformedSheet1, null, 4));
    // console.log(JSON.stringify(transformedSheet2, null, 4));
};
parserTest();
