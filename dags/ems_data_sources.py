from airflow.operators.python_operator import PythonOperator, BranchPythonOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.email_operator import EmailOperator
from airflow.operators.http_operator import SimpleHttpOperator
from airflow.models import DAG

from datetime import datetime, timedelta
import urllib.parse as urlparse
import tempfile
import hjson
import os
from utils.helpers import fc_to_gdf, diff_gdf_geom, diff_gdf_props, retrieve_data


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2018, 5, 20),
    'email': ['nick.peihl@elastic.co'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=30),
    'catchup': False
}

SOURCE_FILES = [
    'ca/provinces.hjson',
    'de/states.hjson',
    'fr/departments.hjson',
    'zh/provinces.hjson'
]


def compare_ds(**kwargs):
    (sourceDs, existingDs) = kwargs['task_instance'].xcom_pull(
        key=None, task_ids=['extract_source_data', 'retrieve_existing_data'])
    sourceDf = fc_to_gdf(sourceDs)
    existingDf = fc_to_gdf(existingDs)
    prop_diff = diff_gdf_props(existingDf, sourceDf)
    geom_diff = diff_gdf_geom(existingDf, sourceDf)
    if prop_diff or geom_diff:
        kwargs['task_instance'].xcom_push(
            key='properties_changes', value=prop_diff)
        kwargs['task_instance'].xcom_push(
            key='geometry_changes', value=geom_diff)
        return 'data_changed'
    else:
        return 'cleanup'


def create_dag(source_file):
    with open(source_file, 'r') as f:
        source = hjson.load(f, object_pairs_hook=dict)
        dag_id = 'dag_{}'.format(source['name'])
        qs = urlparse.urlencode(source['query'])
        source_endpoint = urlparse.urlparse(source['data']).path
        existing_endpoint = '/blob/{}'.format(source['manifestId'])
        dag = DAG(
            dag_id,
            default_args=default_args,
            schedule_interval='@daily'
        )
        extract = SimpleHttpOperator(
            task_id='extract_source_data',
            http_conn_id='sophox',
            endpoint=source_endpoint,
            method='GET',
            data=qs,
            headers={'Content-Type': 'application/json'},
            xcom_push=True,
            dag=dag
        )
        retrieve_existing_data = SimpleHttpOperator(
            task_id='retrieve_existing_data',
            http_conn_id='ems_vector',
            endpoint=existing_endpoint,
            method='GET',
            data={},
            headers={'Content-Type': 'application/json'},
            xcom_push=True,
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
                {% for f in ti.xcom_pull(task_ids='compare_datasets', key='geometry_changes')  %}
                    <li>{{ f }}</li>
                {% endfor %}
                </ul>
            </div>

        """

        data_change = EmailOperator(
            task_id='data_changed',
            to='nick.peihl@elastic.co',
            subject='A source dataset for EMS has changed',
            html_content=HTML_CONTENT_TEMPLATE,
            params={
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
