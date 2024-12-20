import fetch from 'node-fetch';
import hjson from 'hjson';

const wdItem = process.argv[2];

if (!wdItem) {
  throw new Error(`Include the Wikidata item ID to get labels for. e.g. node scripts/wikidata-labels.js Q5852411`);
}

async function wikidataTranslations(id) {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}`);
    const json = await res.json();
    const labels = json.entities[id].labels;
    const translations = {};
    for (const key of Object.keys(labels).sort()) {
      translations[key] = labels[key].value;
    }
    return translations;
}

wikidataTranslations(wdItem)
  .then(labels => console.log(hjson.stringify(labels)));
