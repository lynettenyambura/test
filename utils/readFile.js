"use strict";

exports.readFile = function (path, currentEncoding, toEncoding) {
    var fs = require("fs");
    var buffer = fs.readFileSync(path);
    if (currentEncoding) {
        var Iconv = require("iconv").Iconv;
        var iconv = new Iconv(currentEncoding, toEncoding ? toEncoding : "utf8");
        buffer = iconv.convert(buffer);
    }
    return buffer;
};