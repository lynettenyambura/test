"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");

function parsePage({responseBody, URL}) {
    const text = responseBody.content.toString();
    let boundary = "-{20,}\\d{5,}[-]*";
    // let boundary = "---------------------------4103961533101648661712293079";
    let boundaryRegex = new RegExp(`\\s*${boundary}\\s*`, "igm");
    const results = text.split(boundaryRegex).filter(x => x && x.trim());
    let form = {};
    let formDataString = `const form = new FormData();`;
    let fields = results.map(f => {
        f = f.replace(/(\\n|\\r)/g, " ");
        // .replace(/[-\d]+$/,"");
        let match = /name="([^"]+)"([\s]+(.*))?$/i.exec(f);
        if (!match) {
            console.log('nada: ' + f);
            return;
        }
        let name = match[1];
        let value = (match[3] || "").replace(/\s*-*$/i, '');
        // console.log(name, ":", value);
        return [name, value];
    }).filter(x => x && x[0]);
    fields.forEach(x => {
        form[x[0]] = x[1];
        formDataString += `\nform.append('${x[0]}', '${x[1]}');`
    });
    console.log(formDataString);
    return [form];
}

const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/./pdf/ddd.txt");
    buffer = parsePage({responseBody: {content: buffer}, URL: ""});
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
