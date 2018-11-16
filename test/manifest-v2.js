/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tap = require('tap').test;
const { generateCatalogueManifest, generateVectorManifest } = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');
const duplicateIds = require('./fixtures/duplicateIds.json');
const duplicateHumanNames = require('./fixtures/duplicateHumanNames.json');
const weightedSources = require('./fixtures/weighted-sources.json');
const fieldInfo = require('./fixtures/fieldInfo.json');

const v2Expected = {
  'layers': [
    {
      'attribution': 'Similarion',
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
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Rohan Kingdoms',
      'url': `https://vector-staging.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree`,
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
      'id': 'rohan_v2.topo.json',
      'meta': {
        'feature_collection_path': 'data',
      },
    }, {
      'attribution': 'Similarion',
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
  'layers': [
    {
      'attribution': 'Similarion',
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
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Rohan Kingdoms',
      'url': `https://vector.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree`,
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
      'id': 'rohan_v2.topo.json',
      'meta': {
        'feature_collection_path': 'data',
      },
    },
  ],
};

tap('v2 tests', t => {
  const v2 = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v2, v2Expected, 'v2');

  const prod = generateVectorManifest(sources, {
    version: 'v2',
    production: true,
    hostname: 'vector.maps.elastic.co',
  });
  t.deepEquals(prod, prodExpected, 'production');

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

  const weightedOrder = generateVectorManifest(weightedSources, {
    version: 'v2',
  }).layers.map(layer => layer.name);
  t.deepEquals(weightedOrder, ['Rohan Kingdoms', 'Gondor Kingdoms', 'Mordor Regions', 'Shire regions']);


  const fieldInfoTest = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'vector-staging.maps.elastic.co',
    opts: { fieldInfo: fieldInfo },
  });
  t.deepEquals(fieldInfoTest, v2Expected, 'fieldInfos not used in v2');


  t.throws(unsafeDuplicateIds, 'Source ids cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateHumanNames, 'Source human names cannot be duplicate in intersecting versions');

  const v2Catalogue = generateCatalogueManifest({
    version: 'v2',
    tileHostname: 'tiles-maps-stage.elastic.co',
    vectorHostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v2Catalogue, {
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: 'https://tiles-maps-stage.elastic.co/v2/manifest',
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
  t.deepEquals(prodCatalogue, {
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
