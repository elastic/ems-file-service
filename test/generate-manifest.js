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
const duplicateNames = require('./fixtures/duplicateNames.json');

const v1Expected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Gondor Kingdoms',
    'url': `https://vector-staging.maps.elastic.co/blob/222222222222?elastic_tile_service_tos=agree`,
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
    'url': `https://vector-staging.maps.elastic.co/blob/111111111111?elastic_tile_service_tos=agree`,
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
      'url': `https://vector-staging.maps.elastic.co/blob/222222222222?elastic_tile_service_tos=agree`,
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
      'url': `https://vector-staging.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
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

const v6Expected = {
  'layers': [
    {
      'layer_id': 'gondor',
      'created_at': '1200-02-28T17:13:39.288909',
      'attribution': {
        'en': [
          'Similarion',
        ],
      },
      'formats': [
        {
          'format': 'geojson',
          'url': 'https://vector-staging.maps.elastic.co/files/gondor_v3.geo.json?elastic_tile_service_tos=agree',
        },
      ],
      'fields': [
        {
          'type': 'property',
          'id': 'label_en',
          'label': 'Kingdom name (English)',
        },
      ],
      'layer_name': {
        'en': 'Gondor Kingdoms',
        'de': 'Gondor',
        'zh': '魔多',
      },
    }, {
      'layer_id': 'rohan',
      'created_at': '1200-02-28T17:13:39.456456',
      'attribution': {
        'en': [
          'Similarion',
        ],
      },
      'formats': [
        {
          'format': 'topojson',
          'url': 'https://vector-staging.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree',
        },
      ],
      'fields': [
        {
          'type': 'property',
          'id': 'label_en',
          'label': 'Kingdom name (English)',
        },
      ],
      'layer_name': {
        'en': 'Rohan Kingdoms',
        'de': 'Rohan',
        'zh': '洛汗',
      },
    }, {
      'layer_id': 'shire',
      'created_at': '1532-12-25T18:45:32.389979',
      'attribution': {
        'en': ['Similarion'],
      },
      'formats': [
        {
          'format': 'geojson',
          'url': `https://vector-staging.maps.elastic.co/files/shire_v2.geo.json?elastic_tile_service_tos=agree`,
        },
      ],
      'fields': [
        {
          'type': 'property',
          'id': 'label_en',
          'label': 'Region name (English)',
        },
        {
          'type': 'property',
          'id': 'label_ws',
          'label': 'Region name (Westron)',
        },
      ],
      'layer_name': {
        'en': 'Shire regions',
        'de': 'Auenland',
        'zh': '夏爾',
      },
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
      'url': `https://vector.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree`,
      'format': 'topojson',
      'fields': [
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

const safeDuplicatesExpected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Isengard Regions',
    'url': 'https://vector-staging.maps.elastic.co/blob/111111111111?elastic_tile_service_tos=agree',
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
    hostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v1, v1Expected, 'v1');

  const v2 = generateVectorManifest(sources, {
    version: 'v2',
    hostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v2, v2Expected, 'v2');

  const v6 = generateVectorManifest(sources, {
    version: 'v6.6',
    hostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v6, v6Expected, 'v6.6');

  const prod = generateVectorManifest(sources, {
    version: 'v2',
    production: true,
    hostname: 'vector.maps.elastic.co',
  });
  t.deepEquals(prod, prodExpected, 'production');

  const noVersion = generateVectorManifest(sources);
  t.deepEquals(noVersion, { layers: [] });

  const unsafeDuplicateIds = function () {
    return generateVectorManifest(duplicateIds, {
      version: 'v2',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const safeDuplicateIds = function () {
    return generateVectorManifest(duplicateIds, {
      version: 'v1',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const unsafeDuplicateHumanNames = function () {
    return generateVectorManifest(duplicateHumanNames, {
      version: 'v2',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const safeDuplicateHumanNames = function () {
    return generateVectorManifest(duplicateHumanNames, {
      version: 'v1',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  const unsafeDuplicateNames = function () {
    return generateVectorManifest(duplicateNames, {
      version: 'v6',
      hostname: 'vector-staging.maps.elastic.co',
    });
  };

  t.throws(unsafeDuplicateIds, 'Source ids cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateHumanNames, 'Source human names cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateNames, 'Source names cannot be duplicate in v6 manifests');
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
