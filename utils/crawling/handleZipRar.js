"use strict";


const handleCompressed = async function ({canonicalURL, headers, responsePage}) {
    responsePage = responsePage|| await fetchPage({canonicalURL, headers});
    let out = [];
    let mime = responsePage.response.headers.get('content-type');
    let isRar = !!/rar/i.test(mime);
    let isZip = !!/zip/i.test(mime);
    //throw(JSON.stringify({isRar, isZip, mime}));
    if (responsePage && responsePage.response.ok && (isRar||isZip)) {
        out = isRar?await unrar({request: responsePage.request, response: responsePage.response}):
            await unzip({request: responsePage.request, response: responsePage.response});
        let accepted = [];
        let $ = cheerio.load("<html lang='en'><body><h2>Contents</h2><ol id='zip-content-links'></ol></body></html>");
        let ul = $("ol#zip-content-links");
        for (let i = 0; i < out.length; i++) {
            let responsePage = out[i];
            responsePage.canonicalURL = encodeURI(decodeURI(responsePage.canonicalURL));
            ul.append(`<li><a href="${responsePage.canonicalURL}">${responsePage.canonicalURL}</a></li>\n`);
            let contentType = responsePage.response.headers.get("content-type");
            if (/empty|spreadsheet|excel/i.test(contentType)) {
                continue;
            }
            //not else
            if (/\.gif?$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "image/gif");
            } else if (/\.png?$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "image/png");
            } else if (/\.jpe?g$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "image/jpeg");
            } else if (/\.tiff?$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "image/tiff");
            } else if (/\.pdf$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "application/pdf");
            } else if (/\.doc$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "application/msword");
            } else if (/\.docx$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            } else if (/\.html?$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "text/html");
            } else if (/\.txt$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "text/plain");
                //} else if (/\.xml$/i.test(responsePage.canonicalURL)) {
                //  responsePage.response.headers.set('content-type', "text/xml");
            } else if (/\.json$/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "application/json");
            } else if (/\.xlsx/i.test(responsePage.canonicalURL)) {
                responsePage.response.headers.set('content-type', "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            } else {
                continue;
            }
            accepted.push(responsePage);
        }
        out = accepted;
        out.push(simpleResponse({canonicalURL, mimeType: "text/html", responseBody: $.html()}))
    } //else out = [responsePage];
    return out;
};
