DATA_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../data)
SCRIPTS_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../scripts)
.DEFAULT_GOAL := all

.PHONY: all refresh-autonomous-communities

all: refresh-autonomous-communities

# Refresh spain_autonomous_communities_v8.geo.json properties from Sophox
#
# Re-runs the SPARQL query in autonomous-communities.hjson and updates the
# feature properties in place. Geometries are not modified.
# Wikidata moved the Balearic Islands community from Q5765 to Q107356467.
refresh-autonomous-communities:
	node $(SCRIPTS_DIR)/refresh-properties.js \
	  --id-map Q5765=Q107356467 \
	  ./autonomous-communities.hjson \
	  $(DATA_DIR)/spain_autonomous_communities_v8.geo.json
