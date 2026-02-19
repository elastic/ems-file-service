DATA_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../data)
V1 := $(DATA_DIR)/norway_counties_v1.geo.json
V2 := $(DATA_DIR)/norway_counties_v2.geo.json
.DEFAULT_GOAL := all

.PHONY: all clean

all: $(V2)

clean:
	rm -f $(V2) /tmp/no_innlandet.geo.json /tmp/no_agder.geo.json /tmp/no_vestland.geo.json

# NO-04 (Hedmark) + NO-05 (Oppland) → NO-34 (Innlandet)
/tmp/no_innlandet.geo.json: $(V1)
	mapshaper $< \
	  -filter '"NO-04,NO-05".split(",").indexOf(iso_3166_2) > -1' \
	  -dissolve calc="iso_3166_2='NO-34', label_en='Innlandet', label_nn='Innlandet', label_nb='Innlandet'" \
	  -o format=geojson $@

# NO-09 (Aust-Agder) + NO-10 (Vest-Agder) → NO-42 (Agder)
/tmp/no_agder.geo.json: $(V1)
	mapshaper $< \
	  -filter '"NO-09,NO-10".split(",").indexOf(iso_3166_2) > -1' \
	  -dissolve calc="iso_3166_2='NO-42', label_en='Agder', label_nn='Agder', label_nb='Agder'" \
	  -o format=geojson $@

# NO-12 (Hordaland) + NO-14 (Sogn og Fjordane) → NO-46 (Vestland)
/tmp/no_vestland.geo.json: $(V1)
	mapshaper $< \
	  -filter '"NO-12,NO-14".split(",").indexOf(iso_3166_2) > -1' \
	  -dissolve calc="iso_3166_2='NO-46', label_en='Vestland', label_nn='Vestland', label_nb='Vestland'" \
	  -o format=geojson $@

# Combine all v1 features with the 3 new merged features
$(V2): $(V1) /tmp/no_innlandet.geo.json /tmp/no_agder.geo.json /tmp/no_vestland.geo.json
	mapshaper -i combine-files $^ \
	  -merge-layers force \
	  -sort this.properties.iso_3166_2 \
	  -o precision=0.000001 format=geojson prettify $@
	node ../../scripts/clean-geom.js -v $@
