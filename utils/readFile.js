"use strict";

// exports.readFile = function (path, currentEncoding, toEncoding) {
//     var fs = require("fs");
//     var buffer = fs.readFileSync(path);
//     if (currentEncoding) {
//         var Iconv = require("iconv").Iconv;
//         var iconv = new Iconv(currentEncoding, toEncoding ? toEncoding : "utf8");
//         buffer = iconv.convert(buffer);
//     }
//     return buffer;
// };

import fs from 'fs';
import { Iconv } from 'iconv';

export function readFile(path, currentEncoding, toEncoding) {
    let buffer = fs.readFileSync(path);
    if (currentEncoding) {
        const iconv = new Iconv(currentEncoding, toEncoding ? toEncoding : "utf8");
        buffer = iconv.convert(buffer);
    }
    return buffer;
}