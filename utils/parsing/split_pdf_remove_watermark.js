"use strict";

async function parsePage({responseBody, URL, html}) {
    //The URL in this parser was that of a PDF file
    //html is the pdf already converted to html by pdfToHtmlEx, ignored in this case

    if (responseBody.fileFormat === "text/html") {
        return [];
    }

    const pdf2HTMLEx = async (pdfURL) => {

        let URLId = "H" + new Buffer(pdfURL).toString("base64");
        let URLIdN = "H" + sha256(pdfURL) + ".N";
        var resp = await graphql(`
            query {
              nodes(ids: ["${URLId}", "${URLIdN}"]) {
                id
                ... on CrawledURL {
                  lastSuccessfulRequest {
                    outputForFilter(filter: "pdf2htmlEx")
                  }
                }
              }
            }`);

        let node = resp.nodes.find(n => n);

        let html = node && node.lastSuccessfulRequest && node.lastSuccessfulRequest && node.lastSuccessfulRequest.outputForFilter[0] && node.lastSuccessfulRequest.outputForFilter[0] && node.lastSuccessfulRequest.outputForFilter[0].filterOutput && node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content;
        return html;
    };

    let encoding = [{mediaObjectId: responseBody.id, fileFormat: responseBody.fileFormat, dataType: "MEDIA"}];

    let htmlEx = await pdf2HTMLEx(URL);

    if (htmlEx) {
        let $ = cheerio.load(htmlEx);
        if ($.text().length > 500) {
            $("div:contains('Documento digitalizado')").each((idx, el) => {
                if ($(el).text().trim() === "Documento digitalizado") {
                    $(el).remove();
                }

            });
            $("div:contains('Publicación electrónica')").each((idx, el) => {
                if ($(el).text().trim() === "Publicación electrónica") {
                    $(el).remove();
                }

            });
            htmlEx = $.html();
            encoding.push({fileFormat: "text/html", content: htmlEx, dataType: "MEDIA", locale: "es"});
        }
    }


    //const $ = cheerio.load(html || responseBody.content);
    const results = [];
    //let text = $('body').text().trim().split(/\s*\n\s*/g).filter(x => x);
    let text = html.split(/\s*\n\s*/g).filter(x => x);
    let joinedText = text.slice(0, 100).join(" ");
    let fields = {
        tomo: /T\s*O\s*M\s*O\s+([A-Z]+)/, gazette_date: /(\d[\d\s.]*\sd\s*e\s*l?\s*[a-z\s]+\sd\s*e\s*l?\s*[\d\s]+)/i,
        gazette_number: /N\s*ú\s*m[.ero\s]* (\d[\d\s]+)/i
    };
    let d = {};
    for (let field in fields) {
        let match = fields[field].exec(joinedText);
        if (match) {
            let value = fields[field].exec(match[0])[1];
            if (/date/i.test(field)) {
                value = /(\d[\d\s.]*)\sd\s*e\s*l?\s*([a-z\s]+)\sd\s*e\s*l?\s*([\d\s]+)/i.exec(value);
                value = `${value[1].replace(/\\s/g, "")}-${value[2].replace(/\\s/g, "")}-${value[3].replace(/\\s/g, "")}`;
                let date = moment(value, ["D-MMMM-YYYY"], 'es');
                value = date.isValid() ? date.format("YYYY-MM-DD") : value;
            } else if (/number/i.test(field))
                value = value.replace(/\s/g, "");
            d[field] = value;
        }
    }
    joinedText = text.slice(0, 4000).join(" ");
    let match = joinedText.match(/P\s*[áa]\s*g[\s]*[s.]*\s*(\d[-\s\d]*)/ig);


    results.push(Object.assign({
        URI: URL,
    }, d));

    results[0].encoding = encoding;

    return results;
}