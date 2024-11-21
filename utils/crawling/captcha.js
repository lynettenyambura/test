"use strict";


const fetchWithCaptcha = async function ({canonicalURL}) {
    const $ = cheerio.load("html with captcha URL");
    let captchaURL = $("img#captcha").attr('src');//fetch captureURL
    captchaURL = captchaURL ? url.resolve(canonicalURL, captchaURL) : null;
    if (!captchaURL) throw new Error("Captcha URL not found in home:\n");
    let captchaPage = await fetchPage({canonicalURL: captchaURL, requestOptions: {method: "GET"}});

    console.log("solving captcha");
    let captchaResult = await resolveCaptcha(await captchaPage.response.buffer());
    console.log('captcha result:', captchaResult);
    if (!captchaResult) throw new Error("Captcha not solved successfully: " + captchaResult);

    //you have captcha value as string, use it in form to send

    //PS: This is not for Google ReCaptcha
};

const solveImageCaptcha = async function ({headers, imgUrl}) {
    //this works if the captcha image is retrieved by simple get request.
    //if the image is retrieved by post request, you may need to pass the form data as well.

    let captchaPage = await fetchPage({canonicalURL: imgUrl, requestOptions: {method: "GET"}});

    console.log("solving captcha");
    //this function resolveCaptcha is resident in iceberg, it will not work locally on your machine.
    let captchaResult = await resolveCaptcha(await captchaPage.response.buffer());
    console.log('captcha result:', captchaResult);
    if (!captchaResult) throw new Error("Captcha not solved successfully: " + captchaResult);

};
