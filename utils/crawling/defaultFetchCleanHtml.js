"use strict";

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const responses = await defaultFetchURL({canonicalURL, headers});
    for (let i = 0; i < responses.length; i++) {
        let responsePage = responses[i];
        if (/html/i.test(responsePage.response.headers.get('content-type'))) {
            let html = await responsePage.response.text();
            const $ = cheerio.load(html, {decodeEntities: false});
            $("script, base, frame, frameset").remove();
            $("a[href]").each(function (i) {
                let a = $(this);
                let href = a.attr('href');
                let href2 = href ? url.resolve(canonicalURL, href) : null;
                if (href !== href2)
                    a.attr('href', href2);
            });
            responsePage.response = new fetch.Response($.html(), responsePage.response);
        }
    }
    return responses;
}
