"use strict";

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    let responses = await defaultFetchURL({canonicalURL, headers});//defaultFetchURL returns array
    for (let i = 0; i < responses.length; i++) {
        let responsePage = responses[i];
        if (/html/i.test(responsePage.response.headers.get('content-type'))) {
            let buffer = await responsePage.response.buffer();
            let utf8 = iconv.decode(buffer, "latin1");//change encoding
            responsePage.response = new fetch.Response(utf8, responsePage.response);
        }
    }
    return responses;

}