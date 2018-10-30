const fetch = require('node-fetch');
const Hjson = require('hjson');

async function wikidataTranslations(id) {
  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}`);
    const json = await res.json();
    const labels = json.entities[id].labels;
    const translations = {};
    for (const key of Object.keys(labels).sort()) {
      translations[key] = labels[key].value;
    }
    return translations;
  } catch (err) {
    throw err;
  }
}

wikidataTranslations('Q1221156')
  .then(labels => console.log(Hjson.stringify(labels)));
