'use strict';

const scrapeNinjaDownload = async function ({canonicalURL, headers}) {
    let apiHeaders = {
        'X-RapidAPI-Key': 'c331dc30c1msh1b3ed9f2bf07f07p172c48jsn4a42b6d80f15',
        'X-RapidAPI-Host': 'scrapeninja.p.rapidapi.com'
    }
    let _headers = Object.assign(headers, apiHeaders);
    let method = "GET";
    let requestOptions = {method, headers: _headers};
    let requestURL = `https://scrapeninja.p.rapidapi.com/scrape?url=${encodeURIComponent(decodeURI(canonicalURL))}`;
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions});
    let json = await responsePage.response.json();
    if (!json.body) throw new Error(json.message || 'No responseBody.');
    let body = json.body;
    if (json?.info?.isBinary) {
        body = Buffer.from(body, 'base64');
    }
    responsePage.response = new fetch.Response(body, responsePage.response);
    responsePage.response.headers.set('content-type', json?.info?.headers['content-type']);
    let type = responsePage.response.headers.get('content-type');
    if (!/pdf|word/i.test(type)) {
        throw new Error('Neither a PDF nor a WORD Document', canonicalURL)
        responsePage.response.ok = false;
        responsePage.response.statusText = `Neither a PDF nor a WORD Document: ${canonicalURL}\n`;
        responsePage.response.status = 502;
        responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
        return responsePage;
    }
    return responsePage;
};