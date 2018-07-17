const Hjson = require("hjson");
const glob = require("glob");
const fs = require("fs");
const arraySort = require("array-sort");
const sortDesc = require("sort-desc");
const sortAsc = require("sort-asc");
const semver = require("semver");

module.exports = generateManifest;

const ENVIRONMENT =
  process.env.NODE_ENV === "production" ? "production" : "staging";

const MANIFESTHOSTNAME =
  ENVIRONMENT === "production"
    ? "vector.maps.elastic.co"
    : "staging-dot-elastic-layer.appspot.com";

function generateManifest(version) {
  if (!version || !semver.valid(semver.coerce(version))) {
    return new Error("A valid version parameter must be defined");
  }
  const layers = [];
  glob.sync("sources/**/*.*json").forEach(source => {
    const f = fs.readFileSync(source, "utf8");
    const data = Hjson.parse(f);
    const manifestVersion = semver.coerce(version);
    if (semver.satisfies(manifestVersion, data.versions)) {
      switch (semver.major(manifestVersion)) {
        case 1:
          layers.push(manifestLayerV1(data));
          break;
        case 2:
          layers.push(manifestLayerV2(data));
          break;
      }
    }
  });
  manifest = {
    layers: arraySort(layers, compare("weight", "DESC"), compare("name")),
  };
  return manifest;
}

function compare(prop, order) {
  return (x, y) => {
    const a = x[prop].toString();
    const b = y[prop].toString();
    switch (order) {
      case "DESC":
        return sortDesc(a, b);
        break;
      case "ASC":
      default:
        return sortAsc(a, b);
        break;
    }
  };
}

function manifestLayerV1(data) {
  const manifestId =
    typeof data.id === "object" ? data.id[ENVIRONMENT] : data.id;
  const layer = {
    attribution: data.attribution,
    weight: data.weight,
    name: data.humanReadableName,
    url: `https://${MANIFESTHOSTNAME}/blob/${manifestId}?elastic_tile_service_tos=agree`,
    format: data.conform.type,
    fields: data.fieldMapping.map(fieldMap => {
      return {
        name: fieldMap.dest,
        description: fieldMap.desc,
      };
    }),
    created_at: data.createdAt,
    tags: [],
    id: manifestId,
  };
  return layer;
}

function manifestLayerV2(data) {
  layer = manifestLayerV1(data);
  if (layer.format === "topojson") {
    layer.meta = {
      feature_collection_path: "data",
    };
  }
  return layer;
}
