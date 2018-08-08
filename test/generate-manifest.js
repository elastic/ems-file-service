const tape = require('tape');
const generateManifest = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');
const duplicateIds = require('./fixtures/duplicateIds.json');
const duplicateHumanNames = require('./fixtures/duplicateHumanNames.json');

const v1Expected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Gondor Kingdoms',
    'url': `https://staging-dot-elastic-layer.appspot.com/files/gondor_v2.json?elastic_tile_service_tos=agree`,
    'format': 'geojson',
    'fields': [{
      'name': 'label_en',
      'description': 'Kingdom name (English)'
    }],
    'created_at': '1200-02-28T17:13:39.288909',
    'tags': [],
    'id': 222222222222
  }, {
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Mordor Regions',
    'url': `https://staging-dot-elastic-layer.appspot.com/files/mordor_v1.json?elastic_tile_service_tos=agree`,
    'format': 'geojson',
    'fields': [
      {
        'name': 'label_en',
        'description': 'Region name (English)'
      }
    ],
    'created_at': '1000-01-02T17:12:15.978370',
    'tags': [],
    'id': 111111111111
  }]
};

const v2Expected = {
  'layers': [
    {
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Gondor Kingdoms',
      'url': `https://staging-dot-elastic-layer.appspot.com/files/gondor_v2.json?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)'
        }
      ],
      'created_at': '1200-02-28T17:13:39.288909',
      'tags': [],
      'id': 222222222222
    }, {
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Shire regions',
      'url': `https://staging-dot-elastic-layer.appspot.com/files/shire_v2.json?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'label_en',
          'description': 'Region name (English)'
        },
        {
          'name': 'label_ws',
          'description': 'Region name (Westron)'
        }
      ],
      'created_at': '1532-12-25T18:45:32.389979',
      'tags': [],
      'id': 333333333333
    }
  ]
};

const prodExpected = {
  'layers': [
    {
      'attribution': 'Similarion',
      'weight': 0,
      'name': 'Gondor Kingdoms',
      'url': `https://vector.maps.elastic.co/files/gondor_v2.json?elastic_tile_service_tos=agree`,
      'format': 'geojson',
      'fields': [
        {
          'name': 'label_en',
          'description': 'Kingdom name (English)'
        }
      ],
      'created_at': '1200-02-28T17:13:39.288909',
      'tags': [],
      'id': 222222222222
    }
  ]
};


const safeDuplicatesExpected = {
  'layers': [{
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Isengard Regions',
    'url': 'https://staging-dot-elastic-layer.appspot.com/files/isengard_v1.json?elastic_tile_service_tos=agree',
    'format': 'geojson',
    'fields': [
      {
        'name': 'label_en',
        'description': 'Region name (English)'
      }
    ],
    'created_at': '1000-01-02T17:12:15.978370',
    'tags': [],
    'id': 111111111111
  }]
};

tape('Generate manifests', t => {
  const v1 = generateManifest(sources, {
    version: 'v1',
    hostname: 'staging-dot-elastic-layer.appspot.com'
  });
  t.deepEquals(v1, v1Expected);

  const v2 = generateManifest(sources, {
    version: 'v2',
    hostname: 'staging-dot-elastic-layer.appspot.com'
  });
  t.deepEquals(v2, v2Expected);

  const prod = generateManifest(sources, {
    version: 'v2',
    production: true,
    hostname: 'vector.maps.elastic.co'
  });
  t.deepEquals(prod, prodExpected);

  const noVersion = generateManifest(sources);
  t.deepEquals(noVersion, { layers: [] });

  const unsafeDuplicateIds = function () {
    return generateManifest(duplicateIds, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  const safeDuplicateIds = function () {
    return generateManifest(duplicateIds, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  const unsafeDuplicateHumanNames = function () {
    return generateManifest(duplicateHumanNames, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  const safeDuplicateHumanNames = function () {
    return generateManifest(duplicateHumanNames, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  t.throws(unsafeDuplicateIds, 'Source ids cannot be duplicate in intersecting versions');
  t.throws(unsafeDuplicateHumanNames, 'Source human names cannot be duplicate in intersecting versions');
  t.deepEquals(safeDuplicateIds(), safeDuplicatesExpected, 'Source ids can be duplicate in non-intersecting versions');
  t.deepEquals(safeDuplicateHumanNames(), safeDuplicatesExpected, 'Source human names can be duplicate in non-intersecting versions');
  t.end();
});
