/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const { generateCatalogueManifest, generateVectorManifest } = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');
const duplicateNames = require('./fixtures/duplicateNames.json');
const fieldInfo = require('./fixtures/fieldInfo.json');

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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'de': 'name (en)',
            'en': 'name (en)',
            'zh': '名称 (en)',
          },
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'de': 'name (en)',
            'en': 'name (en)',
            'zh': '名称 (en)',
          },
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'de': 'name (en)',
            'en': 'name (en)',
            'zh': '名称 (en)',
          },
        },
        {
          'type': 'property',
          'id': 'label_ws',
          'label': {
            'de': 'name (ws)',
            'en': 'name (ws)',
            'zh': '名称 (ws)',
          },
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
          'url': 'https://vector.maps.elastic.co/files/gondor_v3.geo.json?elastic_tile_service_tos=agree',
        },
      ],
      'fields': [
        {
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'de': 'name (en)',
            'en': 'name (en)',
            'zh': '名称 (en)',
          },
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
          'url': 'https://vector.maps.elastic.co/files/rohan_v2.topo.json?elastic_tile_service_tos=agree',
        },
      ],
      'fields': [
        {
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'de': 'name (en)',
            'en': 'name (en)',
            'zh': '名称 (en)',
          },
        },
      ],
      'layer_name': {
        'en': 'Rohan Kingdoms',
        'de': 'Rohan',
        'zh': '洛汗',
      },
    },
  ],
};

const fieldInfoFallbackExpected = {
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'en': 'Wikidata identifier',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'en': 'Kingdom name (English)',
          },
        },
      ],
      'layer_name': {
        'en': 'Gondor Kingdoms',
        'de': 'Gondor',
        'zh': '魔多',
      },
    },
    {
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'en': 'Wikidata identifier',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'en': 'Kingdom name (English)',
          },
        },
      ],
      'layer_name': {
        'en': 'Rohan Kingdoms',
        'de': 'Rohan',
        'zh': '洛汗',
      },
    },
  ],
};

const fieldInfoMissingNameExpected = {
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'en': 'Kingdom name (English)',
          },
        },
      ],
      'layer_name': {
        'en': 'Gondor Kingdoms',
        'de': 'Gondor',
        'zh': '魔多',
      },
    },
    {
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
          'type': 'id',
          'id': 'wikidata',
          'label': {
            'de': 'Wikidata-Kennung',
            'en': 'Wikidata identifier',
            'zh': '维基数据标识符',
          },
        },
        {
          'type': 'property',
          'id': 'label_en',
          'label': {
            'en': 'Kingdom name (English)',
          },
        },
      ],
      'layer_name': {
        'en': 'Rohan Kingdoms',
        'de': 'Rohan',
        'zh': '洛汗',
      },
    },
  ],
};

module.exports = function (t) {
  const v6 = generateVectorManifest(sources, {
    version: 'v6.6',
    hostname: 'vector-staging.maps.elastic.co',
    fieldInfo: fieldInfo,
  });
  t.deepEquals(v6, v6Expected, 'v6.6');

  const prod = generateVectorManifest(sources, {
    version: 'v6.6',
    production: true,
    hostname: 'vector.maps.elastic.co',
    fieldInfo: fieldInfo,
  });
  t.deepEquals(prod, prodExpected, 'production');

  const unsafeDuplicateNames = function () {
    return generateVectorManifest(duplicateNames, {
      version: 'v6.6',
      hostname: 'vector-staging.maps.elastic.co',
      fieldInfo: fieldInfo,
    });
  };
  t.throws(unsafeDuplicateNames, 'Source names cannot be duplicate in v6 manifests');

  const fieldInfoFallback = generateVectorManifest(sources, {
    version: 'v6.6',
    hostname: 'vector-staging.maps.elastic.co',
    production: true,
  });
  t.deepEquals(fieldInfoFallback, fieldInfoFallbackExpected,
    'should fallback to source field `desc` if fieldInfos is not available');

  const fieldInfoMissingName = generateVectorManifest(sources, {
    version: 'v6.6',
    hostname: 'vector-staging.maps.elastic.co',
    production: true,
    fieldInfo: {
      'wikidata': {
        'wikidata': 'Q43649390',
        'i18n': {
          'de': 'Wikidata-Kennung',
          'en': 'Wikidata identifier',
          'zh': '维基数据标识符',
        },
      },
    },
  });
  t.deepEquals(fieldInfoMissingName, fieldInfoMissingNameExpected,
    'should fallback to source field `desc` if `fieldInfo.name.i18n` is not available');

  const v6Catalogue = generateCatalogueManifest({
    version: 'v6.6',
    tileHostname: 'tiles-maps-stage.elastic.co',
    vectorHostname: 'vector-staging.maps.elastic.co',
  });
  t.deepEquals(v6Catalogue, {
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: 'https://tiles-maps-stage.elastic.co/v2/manifest',
      type: 'tms',
    }, {
      id: 'geo_layers',
      name: 'Elastic Maps Vector Service',
      manifest: 'https://vector-staging.maps.elastic.co/v6.6/manifest',
      type: 'file',
    }],
  });

  const prodCatalogue = generateCatalogueManifest({
    version: 'v6.6',
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
      manifest: 'https://vector.maps.elastic.co/v6.6/manifest',
      type: 'file',
    }],
  });
  t.end();
};
