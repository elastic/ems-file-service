DATA_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../data)
.DEFAULT_GOAL := all

all:
	mapshaper $(DATA_DIR)/admin_regions_lvl2_v2.geo.json \
	-filter '"AE".indexOf(country_iso2_code) > -1' \
	-filter-fields region_iso_code,region_name \
  -dissolve multipart where="['AE-AJ','AE-X02~'].indexOf(region_iso_code) > -1" calc="region_iso_code='AE-AJ'" \
  -dissolve multipart where="['AE-SH', 'AE-X01~'].indexOf(region_iso_code) > -1" calc="region_iso_code='AE-SH'" \
	-join source=./ae.csv keys='region_iso_code,iso_3166_2' fields='name_ar' \
	-rename-fields iso_3166_2=region_iso_code,label_ar=name_ar,label_en=region_name \
	-o format=geojson prettify field-order=ascending $(DATA_DIR)/uae_emirates_v1.geo.json
