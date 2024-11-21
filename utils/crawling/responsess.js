"use strict";

async function fetchURL({canonicalURL, headers}) {
    let browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(canonicalURL);

    let content = await page.content();
    await browser.close(); //IMPORTANT: CLOSE BROWSER TO AVOID MEMORY LEAKS
    let fetchedPage = {
        canonicalURL,
        response: {
            status: 200,         // http status code,
            ok: true,            // true if the response was succesful
            body: content,  // nodejs stream with the body of the response or a plain string
            headers        // http headers of the response
        },
        request: {
            URL: canonicalURL,            // the actual URL that was requested
            method: "GET",
            headers
        }
    };
    return [fetchedPage];
}
