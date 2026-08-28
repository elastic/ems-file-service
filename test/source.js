/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";
import hjson from "hjson";
import { glob } from "glob";

import { testSourceSchema, testSourceFiles } from "./source-helpers.js";

// Validate EMS source metadata and files (excluding world/ and us/ — see source-world.js, source-us.js)
glob.sync('sources/**/*.hjson', { ignore: ['sources/world/**', 'sources/us/**'] }).forEach((file) => {
  const source = hjson.parse(fs.readFileSync(file, "utf8"));
  testSourceSchema(source);
  testSourceFiles(source);
});

// Validate EMS source template
const template = hjson.parse(
  fs.readFileSync("./templates/source_template.hjson", "utf8")
);
testSourceSchema(template);

// Validate test fixture metadata
glob.sync('test/fixtures/valid-sources/*.json').forEach(file => {
  const sources = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const source of sources) testSourceSchema(source);
});
