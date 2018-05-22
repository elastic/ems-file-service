import urllib.parse as urlparse
import requests
import tempfile
import os
import json
import jsondiff
import pandas as pd
import geopandas as gpd


def retrieve_data(url):
    r = requests.get(url)
    r.raise_for_status()
    return r.text


def fc_to_gdf(fc):
    """
    Create a Geopandas GeoDataFrame from a GeoJSON feature collection
    stored in a Python dict.
    We create a temporary file because `GeoDataFrame.from_features`
    drops the `id` from the Features. See
    https://github.com/geopandas/geopandas/issues/225#issuecomment-324301286
    """
    with tempfile.NamedTemporaryFile() as f:
        f.write(fc.encode('utf-8'))
        f.flush()
        os.fsync(f)
        gdf = gpd.read_file(f.name)
    gdf.set_index('id', inplace=True)
    return gdf


def diff_gdf_props(gdf1, gdf2):
    """
    Analyze the symmetric difference of feature properties for each region
    and return a dictionary of inserts, updates, and deletes for each region.
    """
    df1 = pd.DataFrame(
        gdf1[[col for col in gdf1.columns if col != gdf1._geometry_column_name]])
    df2 = pd.DataFrame(
        gdf2[[col for col in gdf2.columns if col != gdf2._geometry_column_name]])
    json1 = json.loads(df1.to_json(orient='index', force_ascii=False))
    json2 = json.loads(df2.to_json(orient='index', force_ascii=False))
    diff = jsondiff.diff(json1, json2, syntax='explicit')
    return diff


def diff_gdf_geom(gdf1, gdf2):
    """
    Analyze the symmetric difference of the geometry of each
    region and return a GeoJSON of regions with an area
    difference of greater than 0.5%.
    """
    gs1 = gdf1[gdf1._geometry_column_name].buffer(
        0)  # buffer 0 fixes invalid geometry
    gs2 = gdf2[gdf2._geometry_column_name].buffer(0)
    diff = gs1.symmetric_difference(gs2)
    gdf_diff = gpd.GeoDataFrame({
        'area_diff': diff.area,
        'area_region': gs1.area,
        'perc_diff': diff.area/gs1.area,
        'over_threshold': diff.area/gs1.area > 0.005
    }, geometry=diff)
    return gdf_diff[gdf_diff['over_threshold']].to_dict(orient='index')
