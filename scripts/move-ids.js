/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const fs = require('fs');

try {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(`Add the GeoJSON file path to process. e.g. node scripts/move-ids.js data/usa_states_v1.geo.json`);
  }

  const file = fs.readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(file);

  // overwrite the features moving the ID field at the feature level
  geojson.features = geojson.features.map(({ type, geometry, properties }) => {
    const { id, ...propsWithoutId } = properties;
    return { id, type, geometry, properties: propsWithoutId };
  });

  process.stdout.write(JSON.stringify(geojson));
} catch (error) {
  console.log(error.message);
  process.exit(1);
}

