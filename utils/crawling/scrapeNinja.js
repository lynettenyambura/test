/**
 * Scrape via GET method. Not recommended for production, you'd better use POST requests.
 * Fetches data from the Scrapeninja API.
 * @returns {Promise<Response>} - A promise that resolves to a Response object.
 */
const getScrapeNinjaApi = async function ({ canonicalURL }) {
    const url = `https://scrapeninja.p.rapidapi.com/scrape?url=${encodeURIComponent(canonicalURL)}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'c331dc30c1msh1b3ed9f2bf07f07p172c48jsn4a42b6d80f15',
            'X-RapidAPI-Host': 'scrapeninja.p.rapidapi.com'
        },
    };
    try {
        const responsePage = await fetchPage({ canonicalURL, requestURL: url, requestOptions: options });
        if (responsePage.response.status === 200) {
            const json = await responsePage.response.json();
            const { statusCode: status, headers: responseHeaders } = json.info;
            const isBinary = json?.info?.isBinary || false;
            if (status === 200) {
                let body = isBinary ? Buffer.from(json.body, 'base64') : json.body;
                const contentType = responseHeaders['content-type'];
                responsePage.response = new fetch.Response(body, responsePage.response);
                responsePage.response.headers.set('content-type', contentType);
            } else {
                responsePage.response.ok = false;
                responsePage.response.status = 503;
                responsePage.response.statusText = "Complete Text could not be downloaded correctly";
            }
        }else{
            console.error("Request not successfull"); 
        }
        return responsePage;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};

/**
 * Scrape via POST method.
 * Fetches data from the Scrapeninja API.
 * @returns {Promise<Response>} - A promise that resolves to a Response object.
 * @note The POST method used here does not support sequential requests.
 * If sequential requests are required, consider using alternative methods.
 * @see For more examples and recipes on web scraping with Scrapeninja, visit: https://scrapeninja.net/docs/category/examples--recipes/
 */

const postScrapeNinjaApi = async function ({canonicalURL, headers}) {
    const url = 'https://scrapeninja.p.rapidapi.com/scrape'; 
    const rapidApiHeaders = {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'scrapeninja.p.rapidapi.com',
        'x-rapidapi-key': 'c331dc30c1msh1b3ed9f2bf07f07p172c48jsn4a42b6d80f15',
    };
    // Merge the custom headers with the rapidApiHeaders
    let _headers = Object.assign(headers, rapidApiHeaders);
    const requestBody = {
        url: canonicalURL,
        // Example of parameters you can pass:
        // geo: 'eu', // Optional: Specify a geographical region
        // headers: [
        //     'Content-Type: application/x-www-form-urlencoded'
        //     // Additional headers can be added as needed
        // ],
        // method: 'POST', // HTTP method 
        // data: 'key1=val1&key2=val2'
        // Data to be sent in the request body, typically used in POST requests
    };
    let options = {
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(requestBody),
    };
    try {
        // Send the API request and retrieve the response
        let responsePage = await fetchPage({canonicalURL, requestURL: url, requestOptions: options});  
        if (responsePage.response.status === 200) {
            const json = await responsePage.response.json();
            const { statusCode: status, headers: responseHeaders } = json.info;
            const isBinary = json?.info?.isBinary || false;
            if (status === 200) {
                let body = isBinary ? Buffer.from(json.body, 'base64') : json.body;
                const contentType = responseHeaders['content-type'];
                responsePage.response = new fetch.Response(body, responsePage.response);
                responsePage.response.headers.set('content-type', contentType);
            } else {
                responsePage.response.ok = false;
                responsePage.response.status = 503;
                responsePage.response.statusText = "Complete Text could not be downloaded correctly";
            }
        } else {
            console.error("Request not successful");
        }
        return responsePage;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}
