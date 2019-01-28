function titleCase(str) {
  return str.replace(/\w\S*/g, (str) => `${str.charAt(0).toUpperCase()}${str.substr(1).toLowerCase()}`);
}

function stripWdUri(uri) {
  const value = typeof uri === 'string' ? uri : uri.value;
  return value.replace('http://www.wikidata.org/entity/', '');
}

module.exports.titleCase = titleCase;
module.exports.stripWdUri = stripWdUri;
