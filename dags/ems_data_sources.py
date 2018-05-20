from airflow.operators.python_operator import PythonOperator, BranchPythonOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.email_operator import EmailOperator
from airflow.models import DAG

from datetime import datetime, timedelta
import geopandas as gpd
import pandas as pd
import numpy as np
import jsondiff
import tempfile
import requests
import urllib
import urllib.parse as urlparse
import hjson
import json
import os


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2018,5,20),
    'email': ['nick.peihl@elastic.co'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=30),
    'catchup': False
}

EMS_URL = 'http://vector.maps.elastic.co'

SOURCE_FILES = [
    'ca/provinces.hjson',
    'de/states.hjson',
    'fr/departments.hjson',
    'zh/provinces.hjson'
]

def retrieve_data (url):
    fullUrl = urlparse.urljoin(EMS_URL, url)
    r = requests.get(fullUrl)
    r.raise_for_status()
    return r.text

def get_fieldMap_fields (fieldMap):
    return fieldMap['dest']

def test_regression (fields, **kwargs):
    existing_data = kwargs['task_instance'].xcom_pull(task_ids='retrieve_existing_data')
    test_data = kwargs['task_instance'].xcom_pull(task_ids='extract')
    print(test_data)
    return False

def fc_to_gdf (fc):
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

def diff_gdf_props (gdf1, gdf2):
    df1 = pd.DataFrame(gdf1[[col for col in gdf1.columns if col != gdf1._geometry_column_name]])
    df2 = pd.DataFrame(gdf2[[col for col in gdf2.columns if col != gdf2._geometry_column_name]])
    json1 = json.loads(df1.to_json(orient='index', force_ascii=False))
    json2 = json.loads(df2.to_json(orient='index', force_ascii=False))
    diff = jsondiff.diff(json1, json2, syntax='explicit')
    return diff

def diff_gdf_geom (gdf1, gdf2):
    gs1 = gdf1[gdf1._geometry_column_name].buffer(0) # buffer 0 fixes invalid geometry
    gs2 = gdf2[gdf2._geometry_column_name].buffer(0)
    diff = gs1.geom_almost_equals(gs2)
    changed_ids = diff[~diff].index.tolist()
    return changed_ids

def compare_ds (**kwargs):
    (sourceDs, existingDs) = kwargs['task_instance'].xcom_pull(key=None, task_ids=['extract_source_data','retrieve_existing_data'])
    sourceDf = fc_to_gdf(sourceDs)
    existingDf = fc_to_gdf(existingDs)
    if (existingDf.equals(sourceDf)):
        return 'cleanup'
    else:
        prop_diff = diff_gdf_props(existingDf, sourceDf)
        geom_diff = diff_gdf_geom(existingDf, sourceDf)
        kwargs['task_instance'].xcom_push(key='properties_changes', value=prop_diff)
        kwargs['task_instance'].xcom_push(key='geometry_changes', value=geom_diff)
        return 'data_changed'

def create_dag (source_file):
    with open(source_file, 'r') as f:
        source = hjson.load(f, object_pairs_hook=dict)
        dag_id = 'dag_{}'.format(source['name'])
        qs = urlparse.urlencode(source['query'])
        fullUrl = urlparse.urljoin(source['data'], '?{}'.format(qs))
        tmpFile = tempfile.mkstemp(suffix='.json', prefix=dag_id)[1]
        dag = DAG(
            dag_id,
            default_args=default_args,
            schedule_interval='@daily'
        )
        extract = PythonOperator(
            task_id='extract_source_data',
            python_callable=retrieve_data,
            op_kwargs={
                'url': fullUrl
            },
            dag=dag
        )
        retrieve_existing_data = PythonOperator(
            task_id='retrieve_existing_data',
            python_callable=retrieve_data,
            op_kwargs={
                'url': urlparse.urljoin(EMS_URL, '/blob/{}'.format(source['manifestId']))
            },
            dag=dag
        )
        compare_datasets = BranchPythonOperator(
            task_id='compare_datasets',
            python_callable=compare_ds,
            provide_context=True,
            dag=dag
        )

        cleanup = DummyOperator(
            task_id='cleanup',
            dag=dag
        )

        HTML_CONTENT_TEMPLATE = """
            <div>Hi,<br/>

            It looks like the data source for {{ params.name }} has changed.<br/>

            Property changes: {{ ti.xcom_pull(task_ids='compare_datasets', key='properties_changes') }}<br/>

            Feature Ids with geometry changes: 
                <ul>
                {% for id in ti.xcom_pull(task_ids='compare_datasets', key='geometry_changes')  %}
                    <li>{{ id }}</li>
                {% endfor %}
                </ul>
            </div>

        """

        data_change = EmailOperator(
            task_id='data_changed',
            to = 'nick.peihl@elastic.co',
            subject = 'A source dataset for EMS has changed',
            html_content = HTML_CONTENT_TEMPLATE,
            params = {
                'name': source['humanReadableName']
            },
            dag=dag
        )

        retrieve_existing_data >> compare_datasets
        extract >> compare_datasets
        compare_datasets.set_downstream([data_change, cleanup])
        return dag

for f in SOURCE_FILES:
    abs_file = os.path.join('/sources', f)
    dag = create_dag(abs_file)
    dag_id = dag.dag_id
    globals()[dag_id] = dag
    