const uRLifyName = (name) => {
    const spanishCharactersToEnglish = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!name || !name.trim()) return name;
    let replacement = "_"; // replace all non-alphanumeric characters with this
    name = spanishCharactersToEnglish(name)
        .toLowerCase()
        .replace(/[ªº]+/ig, "")
        .trim().replace(/[\s\W]+/g, replacement);
    // replace all trailing replacement character
    while (name.endsWith(replacement)) name = name.slice(0, -replacement.length);
    return name;
}


const testFct = function () {
    let testString = "Servicios de Tránsito Aéreo.";
    let urlReadyString = uRLifyName(testString);
    console.log(urlReadyString);
}
testFct();
