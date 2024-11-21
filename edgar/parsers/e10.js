"use strict";

const moment = require("moment");
const cheerio = require("cheerio");
const url = require("url");
const querystring = require("querystring");
const sanitizeHtml = (x) => x;

function parsePage({responseBody, URL}) {
    const parser = new SecFilingParser(responseBody.content);

    // get all attachments that are tagged as Exhibit 10
    const ex10Documents = parser.documents.filter(doc => fieldMatchesEx10Or99(doc.type) || fieldMatchesEx10Or99(doc.description));

    // find links to them through the main document
    const mainDocument = parser.documents.filter(x => x.type == "8-K" || x.type == "10-K")[0];
    const mainDocumentLinks = mainDocument ? mainDocument.links : {};

    // ex10Documents.push(parser.documents[0]); --- uncomment to add main document to the output

    const attachedFiles = ex10Documents.map(document => ({
        parsedFrom: URL,
        uri: URL + "#" + document.filename,
        ...document,                                       // properties we get from the document itself
        linkAnchor: mainDocumentLinks[document.filename],  // get the title through any link to it
        ...parser.header,                                  // and add up metadata from the filing
    })).filter(doc=>doc.content);     // only return records with content

    const externalLinks = Object.entries(mainDocumentLinks).filter(([link, anchor]) => link.indexOf("http") == 0);

    const externalFiles = externalLinks.map(([link, anchor]) => ({
        parsedFrom: URL,
        linkAnchor: anchor,
        uri: link,
        ...parser.header,
    }));

    return attachedFiles.concat(externalFiles);
}

function fieldMatchesEx10Or99(value) {
    return value && (value.indexOf("EX-10") >= 0 || value.indexOf("EX10") >= 0 || value.indexOf("EX-99") >= 0 || value.indexOf("EX99") >= 0);
}

class SecFilingParser {
    // SEC filings use a peculiar SGML-based format with some tags not being closed.
    // see documentation in https://www.sec.gov/files/edgar/pds_dissemination_spec.pdf
    //
    // We cannot use cheerio to parse it because it will nest elements which are logically siblings

    constructor(content) {
        this.header = this.parseHeader(content);
        this.documents = this.parseDocuments(content);
    }

    parseHeader(content) {
        const secHeaderContent = this.getEnclosedTag('SEC-HEADER', content);
        return new SecFilingHeaderParser(secHeaderContent).toJson();
    }

    parseDocuments(content) {
        const documentsRaw = this.getAllTags('DOCUMENT', content);
        return documentsRaw.filter(x => x).map(this.parseDocument.bind(this));
    }

    objectFromEntries = function (array) {
        let object = {};
        array.forEach(([key, value]) => {
            if (typeof value === "string" && (!object[key] || value.length > object[key].length))
                object[key] = value
        });
        return object;
    }

    parseDocument(rawDocument) {
        const content = this.getEnclosedTag('TEXT', rawDocument);

        // we use the links in the main document to find the proper text for the document
        const $ = cheerio.load(content);
        const linksPairs = Array.from($('a')).filter(el => $(el).attr("href")).map((el) => [$(el).attr('href').replace("http://", "https://"), $(el).text()]);
        const _$ = $("body").clone();
        // create a clone of body element to delete unwanted elements from, without affecting integrity of original body.
        const images = _$.find("img");
        const imagesDeleted = images.length;
        images.remove();
        // remove unwanted text containers
        _$.find("link\\:definition, link\\:usedOn").remove();
        // remove images from original body
        $("img").remove();
        _$.find("[style*='color:white']").each(function(){
            $(this).css('color', 'dark gray');
        })
        _$.find("[style*='font-size']").each(function(){
            let size = $(this).css('font-size');
            let newSize = "1em";
            if(/pt/i.test(size)){
                let no = parseInt(size);
                // if(no){
                //   newSize = `${no/12}em`
                // }
                if(no<6)
                    $(this).remove();
            }
            // $(this).css('font-size', newSize);
        })
        const contents = _$.text().replace(/[\W_]+/ig, "") && {
            dataType: "MEDIA",
            // content: $.text().replace(/[^\w\s]+/ig, ""),
            content: $.html(),
            fileFormat: "text/html",
            // fileFormat: "text/plain"
        } || null;

        const type = this.getOpenTag('TYPE', rawDocument);
        return {
            type,
            normalizedExhibitType: this.normalizedExhibitType(type),
            filename: this.getOpenTag('FILENAME', rawDocument),
            description: this.getOpenTag('DESCRIPTION', rawDocument),
            imagesDeleted,
            content: contents,
            // links: Object.fromEntries(linksPairs),
            links: this.objectFromEntries(linksPairs),
        }
    }


    normalizedExhibitType(type) {
        if (type.indexOf("EX") == 0) {
            return type.split(".")[0];
        }
    }

    getEnclosedTag(tag, content) {
        const matcher = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'gs');
        const match = matcher.exec(content);
        return match ? match[1] : null;
    }

    getOpenTag(tag, content) {
        // tags that are never closed, just terminate implicitly in new line
        const matcher = new RegExp(`<${tag}>(.*)`);
        const match = matcher.exec(content);
        if (!match) {
            console.log("No match for", tag, "in", content.slice(0, 100));
        }

        return match ? match[1] : null;
    }

    getAllTags(tag, content) {
        const matcher = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'gs');
        const entries = content.match(matcher);

        if (!entries) {
            throw(new Error("Can't find tag " + tag + " in " + content));
        }

        return entries.map(entry => {
            const match = matcher.exec(entry);
            return match ? match[1] : null;
        });
    }
}

class SecFilingHeaderParser {
    constructor(rawHeader) {
        this.raw = rawHeader;
    }

    toJson() {
        return {
            companyName: this.parseSimpleLine("COMPANY CONFORMED NAME"),
            acceptanceDatetime: this.parseAcceptanceDatetime(),
            acceptanceDate: this.parseAcceptanceDate(),
            standardIndustrialClassification: this.parseSimpleLine("STANDARD INDUSTRIAL CLASSIFICATION"),
            cik: this.parseSimpleLine("CENTRAL INDEX KEY"),
            businessState: this.parseSimpleLine("STATE"),
            incorporationState: this.parseSimpleLine("STATE OF INCORPORATION"),
        }
    }

    parseAcceptanceDate() {
        const dateTime = this.parseAcceptanceDatetime();
        if (dateTime) {
            // 20240215163458
            return dateTime.slice(0, 4) + "-" + dateTime.slice(4, 6) + "-" + dateTime.slice(6, 8)
        } else {
            return null;
        }
    }

    parseAcceptanceDatetime() {
        const matcher = /<ACCEPTANCE-DATETIME>(.*?)\n/;
        if (matcher.test(this.raw)) {
            return matcher.exec(this.raw)[1];
        }
    }

    parseSimpleLine(label) {
        const matcher = new RegExp(`${label}:(.*?)\n`);
        if (matcher.test(this.raw)) {
            return matcher.exec(this.raw)[1].trim();
        }
    }
}

class SecFilingDocumentParser {
    initialize(rawDocument) {
        this.raw = rawDocument;
        this.type = this.parseType();
    }

    parseType() {
        const typeMatcher = /<TYPE>(.*?)<\/TYPE>/gs;
        if (typeMatcher.test(this.raw)) {
            return typeMatcher.exec(this.raw)[1];
        }
    }
}


const parserTest = function () {
    const fs = require("fs");
    let buffer = fs.readFileSync(__dirname + "/../pdf/err.txt");
    buffer = parsePage({
        responseBody: {content: buffer.toString(), buffer, fileFormat: "text/plain"},
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer.map(x=>{
        let {linkAnchor, companyName, type} = x;
        return {linkAnchor, companyName, type}
    }), null, 4));
    console.log(buffer.length);
};
parserTest();
