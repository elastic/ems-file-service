from airflow.models import DAG
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import BranchPythonOperator

import random
from datetime import datetime, timedelta
from string import Template

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2018,5,1),
    'email': ['nick.peihl@elastic.co'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=30),
    'catchup': False
}

options = [ 'yes', 'no' ]

DAG_NAME = 'vector_layer_updater'

dag = DAG(
    dag_id=DAG_NAME,
    default_args=default_args,
    schedule_interval="@daily"
)

get_source = DummyOperator(
    task_id='get_source_dataset',
    dag=dag
)

get_current = DummyOperator(
    task_id='get_current_dataset',
    dag=dag
)

compare_datasets = DummyOperator(
    task_id='compare_source_and_current_datasets',
    dag=dag
)

change_branch = BranchPythonOperator(
    task_id='has_dataset_changed',
    python_callable=lambda: random.choice(options),
    dag=dag
)

notify = DummyOperator(
    task_id='notify_team_of_updated_dataset',
    dag=dag
)

validate_data = DummyOperator(
    task_id='validate_data',
    dag=dag
)

valid_branch = BranchPythonOperator(
    task_id='is_data_valid',
    python_callable=lambda: random.choice(options),
    dag=dag
)

cleanup = DummyOperator(
    task_id='cleanup',
    dag=dag
)

for option in options:
    t = DummyOperator(
        task_id='data_change_{}'.format(option),
        dag=dag
    )
    t.set_upstream(change_branch)
    if option == 'yes':
        t.set_downstream(validate_data)
        validate_data.set_downstream(valid_branch)
    else:
        t.set_downstream(cleanup)

for option in options:
    t = DummyOperator(
        task_id='valid_data_{}'.format(option),
        dag=dag
    )
    t.set_upstream(valid_branch)
    if option == 'yes':
        t.set_downstream(notify)
    else:
        t.set_downstream(cleanup)


compare_datasets.set_upstream([get_source, get_current])
compare_datasets.set_downstream(change_branch)
notify.set_downstream(cleanup)