"use strict";

async function fetchPage({canonicalURL, requestURL, requestOptions, headers}) {
    if (!requestOptions) requestOptions = {method: "GET", headers};
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    // requestOptions.redirect = "manual"
    // return await fetchWithCookies(requestURL, requestOptions, "zone-2captcha-country-mx")
    return await fetchWithCookies(requestURL, requestOptions, "zone-g1-country-br")
    //return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                // request: Object.assign({URL: requestURL}, requestOptions),
                response
            };
        });
}
