DATA_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../data)
.DEFAULT_GOAL := all

all:
	mapshaper $(DATA_DIR)/admin_regions_lvl2_v2.geo.json \
	-filter '"YE".indexOf(country_iso2_code) > -1' \
	-filter-fields region_iso_code,region_name \
	-join source=./ye.csv keys='region_iso_code,iso_3166_2' fields='name_ar' \
	-rename-fields iso_3166_2=region_iso_code,label_ar=name_ar,label_en=region_name \
	-o format=geojson prettify field-order=ascending $(DATA_DIR)/yemen_governorates_v1.geo.json
