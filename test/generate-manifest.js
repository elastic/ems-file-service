/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tape = require('tape');
const { generateCatalogueManifest, generateVectorManifest } = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');
const duplicateIds = require('./fixtures/duplicateIds.json');
const duplicateHumanNames = require('./fixtures/duplicateHumanNames.json');

const v1Expected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Gondor Kingdoms',
    'url': `https://staging-dot-elastic-layer.appspot.com/blob/222222222222?elastic_tile_service_tos=agree`,
    'format': 'geojson',
    'fields': [{
      'name': 'label_en',
      'description': 'Kingdom name (English)',
    }],
    'created_at': '1200-02-28T17:13:39.288909',
    'tags': [],
    'id': 222222222222,
  }, {
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Mordor Regions',
    'url': `https://staging-dot-elastic-layer.appspot.com/blob/111111111111?elastic_tile_service_tos=agree`,
    'format': 'geojson',
    'fields': [
      {
        'name': 'label_en',
        'description': 'Region name (English)',
      },
    ],
    'created_at': '1000-01-02T17:12:15.978370',
    'tags': [],
    'id': 111111111111,
  }],
};

const v2Expected = {
  'layers': [
    {
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Gondor Kingdoms',
      'url': `https://staging-dot-elastic-layer.appspot.com/blob/222222222222?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
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
      'url': `https://staging-dot-elastic-layer.appspot.com/files/rohan_v2.json?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.456456',
      'tags': [],
      'id': 'rohan_v2.json',
      'meta': {
        'feature_collection_path': 'data',
      },
    }, {
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Shire regions',
      'url': `https://staging-dot-elastic-layer.appspot.com/blob/333333333333?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
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
      'url': `https://vector.maps.elastic.co/files/rohan_v2.json?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)',
        },
      ],
      'created_at': '1200-02-28T17:13:39.456456',
      'tags': [],
      'id': 'rohan_v2.json',
      'meta': {
        'feature_collection_path': 'data',
      },
    },
  ],
};


const safeDuplicatesExpected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Isengard Regions',
    'url': 'https://staging-dot-elastic-layer.appspot.com/blob/111111111111?elastic_tile_service_tos=agree',
    'format': 'geojson',
    'fields': [
      {
        'name': 'label_en',
        'description': 'Region name (English)',
      },
    ],
    'created_at': '1000-01-02T17:12:15.978370',
    'tags': [],
    'id': 111111111111,
  }],
};

tape('Generate vector manifests', t => {
  const v1 = generateVectorManifest(sources, {
    version: 'v1',
    hostname: 'staging-dot-elastic-layer.appspot.com',
  });
  t.deepEquals(v1, v1Expected);

  const v2 = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'staging-dot-elastic-layer.appspot.com',
  });
  t.deepEquals(v2, v2Expected);

  const prod = generateVectorManifest(sources, {
    version: 'v2',
    production: true,
    hostname: 'vector.maps.elastic.co',
  });
  t.deepEquals(prod, prodExpected);

  const noVersion = generateVectorManifest(sources);
  t.deepEquals(noVersion, { layers: [] });

  const unsafeDuplicateIds = function () {
    return generateVectorManifest(duplicateIds, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com',
    });
  };

  const safeDuplicateIds = function () {
    return generateVectorManifest(duplicateIds, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com',
    });
  };

  const unsafeDuplicateHumanNames = function () {
    return generateVectorManifest(duplicateHumanNames, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com',
    });
  };

  const safeDuplicateHumanNames = function () {
    return generateVectorManifest(duplicateHumanNames, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com',
    });
  };

  t.throws(unsafeDuplicateIds, 'Source ids cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateHumanNames, 'Source human names cannot be duplicate in intersecting versions');
  t.deepEquals(safeDuplicateIds(), safeDuplicatesExpected, 'Source ids can be duplicate in non-intersecting versions');
  t.deepEquals(safeDuplicateHumanNames(), safeDuplicatesExpected, 'Source human names can be duplicate in non-intersecting versions');
  t.end();
});

tape('Generate catalogue manifest', t => {
  const v1 = generateCatalogueManifest({
    version: 'v1',
    tileHostname: 'tiles-maps-stage.elastic.co',
    vectorHostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v1, {
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: 'https://tiles-maps-stage.elastic.co/v2/manifest',
      type: 'tms',
    }, {
      id: 'geo_layers',
      name: 'Elastic Maps Vector Service',
      manifest: 'https://vector-staging.maps.elastic.co/v1/manifest',
      type: 'file',
    }],
  });

  const v2 = generateCatalogueManifest({
    version: 'v2',
    tileHostname: 'tiles-maps-stage.elastic.co',
    vectorHostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v2, {
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

  const prod = generateCatalogueManifest({
    version: 'v2',
    tileHostname: 'tiles.maps.elastic.co',
    vectorHostname: 'vector.maps.elastic.co',
  });
  t.deepEquals(prod, {
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
