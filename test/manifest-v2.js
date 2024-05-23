/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";

import { test as tap } from "tap";

import {
  generateCatalogueManifest,
  generateVectorManifest,
} from "../scripts/generate-manifest.js";

const sources = JSON.parse(
  fs.readFileSync("./test/fixtures/valid-sources/sources.json", "utf8")
);
const duplicateIds = JSON.parse(
  fs.readFileSync("./test/fixtures/valid-sources/duplicateIds.json", "utf8")
);
const duplicateHumanNames = JSON.parse(
  fs.readFileSync(
    "./test/fixtures/valid-sources/duplicateHumanNames.json",
    "utf8"
  )
);
const weightedSources = JSON.parse(
  fs.readFileSync("./test/fixtures/valid-sources/weighted-sources.json", "utf8")
);
const badAttribution = JSON.parse(
  fs.readFileSync(
    "./test/fixtures/invalid-sources/bad-attribution.json",
    "utf8"
  )
);
const badVersions = JSON.parse(
  fs.readFileSync("./test/fixtures/invalid-sources/bad-versions.json", "utf8")
);
const fieldInfo = JSON.parse(
  fs.readFileSync("./test/fixtures/fieldInfo.json", "utf8")
);

const v2Expected = {
  'version': '2.0',
  'layers': [
    {
      'attribution': '[The Silmarillion](https://en.wikipedia.org/wiki/The_Silmarillion)|[Elastic Maps Service](https://www.elastic.co/elastic-maps-service)',
      'weight': 0,
      'name': 'Gondor Kingdoms',
      'url': `https://vector-staging.maps.elastic.co/blob/222222222222?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'wikidata',
          'description': 'Wikidata identifier',
        },
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.288909',
      'tags': [],
      'id': 222222222222,
    }, {
      'attribution': 'The Silmarillion',
      'weight': 0,
      'name': 'Rohan Kingdoms',
      'url': `https://vector-staging.maps.elastic.co/blob/444444444444?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
        {
          'name': 'wikidata',
          'description': 'Wikidata identifier',
        },
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.456456',
      'tags': [],
      'id': 444444444444,
      'meta': {
        'feature_collection_path': 'regions',
      },
    }, {
      'attribution': 'The Silmarillion',
      'weight': 0,
      'name': 'Shire regions',
      'url': `https://vector-staging.maps.elastic.co/blob/333333333333?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'wikidata',
          'description': 'Wikidata identifier',
        },
        {
          'name': 'label_en',
          'description': 'Region name (English)',
        },
        {
          'name': 'label_ws',
          'description': 'Region name (Westron)',
        },
      ],
      'created_at': '1532-12-25T18:45:32.389979',
      'tags': [],
      'id': 333333333333,
    },
  ],
};

const prodExpected = {
  'version': '2.0',
  'layers': [
    {
      'attribution': '[The Silmarillion](https://en.wikipedia.org/wiki/The_Silmarillion)|[Elastic Maps Service](https://www.elastic.co/elastic-maps-service)',
      'weight': 0,
      'name': 'Gondor Kingdoms',
      'url': `https://vector.maps.elastic.co/blob/222222222222?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'wikidata',
          'description': 'Wikidata identifier',
        },
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.288909',
      'tags': [],
      'id': 222222222222,
    }, {
      'attribution': 'The Silmarillion',
      'weight': 0,
      'name': 'Rohan Kingdoms',
      'url': `https://vector.maps.elastic.co/blob/444444444444?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
        {
          'name': 'wikidata',
          'description': 'Wikidata identifier',
        },
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.456456',
      'tags': [],
      'id': 444444444444,
      'meta': {
        'feature_collection_path': 'regions',
      },
    },
  ],
};

tap('v2 tests', t => {
  const v2 = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'vector-staging.maps.elastic.co',
  });
  t.same(v2, v2Expected, 'v2');

  const prod = generateVectorManifest(sources, {
    version: 'v2',
    production: true,
    hostname: 'vector.maps.elastic.co',
  });
  t.same(prod, prodExpected, 'production');

  const unsafeDuplicateIds = function () {
    return generateVectorManifest(duplicateIds, {
      version: 'v2',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const unsafeDuplicateHumanNames = function () {
    return generateVectorManifest(duplicateHumanNames, {
      version: 'v2',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const badAttributionTest = function () {
    return generateVectorManifest(badAttribution, {
      version: 'v2',
    });
  };

  const badVersionsTest = function () {
    return generateVectorManifest(badVersions, {
      version: 'v2',
    });
  };

  const weightedOrder = generateVectorManifest(weightedSources, {
    version: 'v2',
  }).layers.map(layer => layer.name);
  t.same(weightedOrder, ['Rohan Kingdoms', 'Gondor Kingdoms', 'Mordor Regions', 'Shire regions']);


  const fieldInfoTest = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'vector-staging.maps.elastic.co',
    opts: { fieldInfo: fieldInfo },
  });
  t.same(fieldInfoTest, v2Expected, 'fieldInfos not used in v2');


  t.throws(unsafeDuplicateIds, 'Source ids cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateHumanNames, 'Source human names cannot be duplicate in intersecting versions');
  t.throws(badAttributionTest, 'Attribution must include a label');
  t.throws(badVersionsTest, 'Version must be a valid range');

  const v2Catalogue = generateCatalogueManifest({
    version: 'v2',
    tileHostname: 'tiles.maps.elstc.co',
    vectorHostname: 'vector-staging.maps.elastic.co',
  });
  t.same(v2Catalogue, {
    version: '2.0',
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: 'https://tiles.maps.elstc.co/v2/manifest',
      type: 'tms',
    }, {
      id: 'geo_layers',
      name: 'Elastic Maps Vector Service',
      manifest: 'https://vector-staging.maps.elastic.co/v2/manifest',
      type: 'file',
    }],
  });

  const prodCatalogue = generateCatalogueManifest({
    version: 'v2',
    tileHostname: 'tiles.maps.elastic.co',
    vectorHostname: 'vector.maps.elastic.co',
  });
  t.same(prodCatalogue, {
    version: '2.0',
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: 'https://tiles.maps.elastic.co/v2/manifest',
      type: 'tms',
    }, {
      id: 'geo_layers',
      name: 'Elastic Maps Vector Service',
      manifest: 'https://vector.maps.elastic.co/v2/manifest',
      type: 'file',
    }],
  });
  t.end();
});
