const { URL } = require('url');
const fetch = require('make-fetch-happen').defaults({
  cacheManager: './.cache',
  retry: {
    retries: 5,
    randomize: true,
  },
});

module.exports = async function getSophoxVectors(opts) {
  opts = {
    format: 'geojson',
    sparql: '',
    ...opts,
  };
  const url = new URL(`https://sophox.org/regions/${opts.format}.json`);
  const sparql = encodeURIComponent(opts.sparql);
  url.search = `sparql=${sparql}`;
  const res = await fetch(url.toString());
  return res.json();
};
