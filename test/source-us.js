/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";
import hjson from "hjson";
import { glob } from "glob";

import { testSourceSchema, testSourceFiles } from "./source-helpers.js";

glob.sync('sources/us/*.hjson').forEach((file) => {
  const source = hjson.parse(fs.readFileSync(file, "utf8"));
  testSourceSchema(source);
  testSourceFiles(source);
});
