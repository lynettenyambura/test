
/*
* Change site URL appropriately, and the siteKey, whether recatpcha is v2 invisible, and proxy
* */

const solveRecaptcha = async function ({siteURL = "https://projudi.tjgo.jus.br/ConsultaJurisprudencia"}) {
    const config = {
        headers: {},//any custom headers
        apiKey: "10122c7066706ebba801995c2e99fbe2",//2captcha subscription key
        siteKey: "6Lc9XJQUAAAAALYjdjJnuNNl8u-zCBSVmmFaps7Z",//k or data-sitekey
        invisible: true,//is it invisible recaptcha?
        proxy: `lum-customer-vlex-zone-2captcha-country-br:dcohwmkemk0n@zproxy.lum-superproxy.io.22225`//match or remove country if necessary
    }
    let customHeaders = {
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, config.headers);

    let method = "GET";
    let requestOptions = {method, headers: _headers};
    let requestURL = `https://2captcha.com/in.php?key=${config.apiKey}&method=userrecaptcha&googlekey=${config.siteKey}&proxy=${config.proxy}&pageurl=${siteURL}${config.invisible ? "&invisible=1" : ""}&json=1`;
    let responsePage = await fetchPage({requestURL, requestOptions});
    let j = await responsePage.response.text();
    let json = JSON.parse(j);
    if (!json || json.status !== 1 || !json.request) throw `Error resolving recaptcha: ${j}`;
    //wait for resolution
    requestURL = `https://2captcha.com/res.php?key=${config.apiKey}&action=get&id=${json.request}&json=1`;
    let gResponse = null;
    let waitLoops = 0;
    do {
        waitLoops++;
        responsePage = await fetchPage({requestURL, requestOptions});
        j = await responsePage.response.text();
        console.log(j);
        if (/CAPCHA_NOT_READY/i.test(j)) {
            await sleepForSeconds(10);
            continue;
        }
        json = JSON.parse(j);
        if (!json || json.status !== 1 || !json.request) throw `Error resolving recaptcha: ${j}`;
        gResponse = json.request;
    }
    while (!gResponse && waitLoops < 10);
    if (!gResponse)
        throw `Error resolving recaptcha, captcha not resolved after total wait duration: ${j}`;
    return gResponse;
};

//create method sleepForSeconds to wait for the captcha to be solved
const sleepForSeconds = function (seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
