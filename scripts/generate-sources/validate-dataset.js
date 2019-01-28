module.exports = validateDataset;

async function validateDataset({ vectors, isoCodes, adminLevel = 1 }) {
  const features = vectors.features || [];
  const featureIsoCodes = new Set(features.map(f => f.properties.iso_3166_2));
  const adminCodes = isoCodes.get(adminLevel);
  const diffs = new Map();
  diffs.set('missing', difference(adminCodes, featureIsoCodes));
  diffs.set('unmatched', difference(featureIsoCodes, adminCodes));
  return diffs;
}

function difference(setA, setB) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}


