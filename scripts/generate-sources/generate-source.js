const fetch = require('make-fetch-happen').defaults({
  cacheManager: './.cache',
  retry: {
    retries: 10,
    randomize: true,
  },
});
const _ = require('lodash');
const { stripWdUri, titleCase } = require('./utils');

const endpointUrl = 'https://query.wikidata.org/sparql';


module.exports = generateSource;

async function generateSource(id, adminLevel = 1) {
  const wikidata = await getWikidata(id, adminLevel);
  if (!wikidata.length) {
    return null;
  }
  const country = wikidata[0].countryLabel.value;
  const translations = await wikidataTranslations(stripWdUri(wikidata[0].id));
  const subdivision = _.get(wikidata.filter(item => {
    const value = _.get(item, 'adminLabel.value', '');
    return _.words(value).length === 1;
  })[0], 'adminLabel.value', `subdivisions${adminLevel}`);
  const name = `${country}_${subdivision}_v1`.toLowerCase().replace(' ', '_');
  const containsAdmin = `wdt:P150${'/wdt:P150'.repeat(adminLevel - 1)}`;
  const now = new Date();
  const source = {
    containsAdmin: containsAdmin,
    wikidatasubdivision: stripWdUri(wikidata[0].id),
    note: titleCase(wikidata[0].idLabel.value),
    languages: _.uniqBy(wikidata, 'languagecode.value')
      .filter(d => d.languagecode.value !== 'en')
      .map(getLanguageData),
    wikidatacountry: stripWdUri(wikidata[0].country),
    countryCode: wikidata[0].countryCodeLabel.value.toUpperCase(),
    name: name,
    legacyIds: [{
      legacyId: `${country} ${subdivision}`,
    }],
    i18nlabels: translations,
    formats: [
      {
        type: 'geojson',
        file: `${name}.geo.json`,
        default: true,
      },
    ],
    creationtime: now.toISOString(),
    id: Math.floor(now * 1000),
  };
  return source;
}

async function getWikidata(id, adminLevel = 1) {
  let wdAdminLevel;
  switch (adminLevel) {
    case 1:
      wdAdminLevel = 'Q10864048';
      break;
    case 2:
      wdAdminLevel = 'Q13220204';
      break;
  }
  const sparqlQuery = `SELECT ?id ?idLabel ?country ?countryLabel ?countryCodeLabel ?languagesLabel ?languagecode ?adminLabel
   WHERE {
    VALUES (?country) {
      (wd:${id})
    }
    ?id wdt:P279 wd:${wdAdminLevel};
    wdt:P17 ?country.
    ?country wdt:P37 ?languages;
             wdt:P297 ?countryCode.
    ?languages wdt:P424 ?languagecode.
    OPTIONAL {?id wdt:P279 ?admin}
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
  }`;
  const fullUrl = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;
  const headers = { 'Accept': 'application/sparql-results+json' };
  const res = await fetch(fullUrl, { headers });
  const json = await res.json();
  const wikidata = json.results.bindings;
  return wikidata;
}

async function wikidataTranslations(id) {
  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}`);
    const json = await res.json();
    const labels = json.entities[id].labels;
    const translations = [];
    for (const key of Object.keys(labels).sort()) {
      translations.push({ lang: key, label: labels[key].value });
    }
    return translations;
  } catch (err) {
    throw err;
  }
}

function getLanguageData(data) {
  return {
    language: data.languagesLabel.value,
    languagecode: data.languagecode.value.replace('-', '_'),
  };
}


// Example:
// const Mustache = require('mustache');
// const fs = require('fs');
// (async () => console.log(Mustache.render(fs.readFileSync('./templates/source_template.mustache', 'utf8'),
//   await generateSource('Q408', 2))))();
