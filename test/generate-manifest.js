const tape = require('tape');
const generateManifest = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');
const duplicateNames = require('./fixtures/duplicateNames.json');
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
      'description': 'Kingdom name (English)'
    }],
    'created_at': '1200-02-28T17:13:39.288909',
    'tags': [],
    'id': 222222222222
  }, {
    'attribution': 'Similarion',
    'weight': 0,
    'name': 'Mordor Regions',
    'url': `https://staging-dot-elastic-layer.appspot.com/blob/111111111111?elastic_tile_service_tos=agree`,
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
      'url': `https://staging-dot-elastic-layer.appspot.com/blob/222222222222?elastic_tile_service_tos=agree`,
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
      'url': `https://staging-dot-elastic-layer.appspot.com/blob/333333333333?elastic_tile_service_tos=agree`,
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
      'url': `https://vector.maps.elastic.co/blob/222222222222?elastic_tile_service_tos=agree`,
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
    'url': 'https://staging-dot-elastic-layer.appspot.com/blob/111111111111?elastic_tile_service_tos=agree',
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

  const unsafeDuplicateNames = function () {
    return generateManifest(duplicateNames, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };
  const unsafeDuplicateHumanNames = function () {
    return generateManifest(duplicateHumanNames, {
      version: 'v2',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  }
  const safeDuplicateNames = function () {
    return generateManifest(duplicateNames, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  const safeDuplicateHumanNames = function () {
    return generateManifest(duplicateHumanNames, {
      version: 'v1',
      hostname: 'staging-dot-elastic-layer.appspot.com'
    });
  };

  t.throws(unsafeDuplicateNames);
  t.throws(unsafeDuplicateHumanNames);
  t.deepEquals(safeDuplicateHumanNames(), safeDuplicatesExpected);
  t.deepEquals(safeDuplicateNames(), safeDuplicatesExpected);
  t.end();
});
