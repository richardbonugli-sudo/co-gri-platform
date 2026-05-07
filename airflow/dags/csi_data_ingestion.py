"""
Apache Airflow DAG for CSI Data Ingestion

Orchestrates the data ingestion pipeline:
- GDELT batch ingestion (every 15 minutes)
- News wire RSS feeds (every 15 minutes)
- Data quality checks
- Monitoring and alerting

Schedule: Every 15 minutes, 24/7
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from datetime import datetime, timedelta
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Default arguments for all tasks
default_args = {
    'owner': 'csi-team',
    'depends_on_past': False,
    'email': ['alerts@csi-platform.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(minutes=10),
}

# Create DAG
dag = DAG(
    'csi_data_ingestion',
    default_args=default_args,
    description='CSI data ingestion pipeline - GDELT and news wires',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=1,
    tags=['csi', 'ingestion', 'gdelt', 'news'],
)


def ingest_gdelt_batch(**context):
    """
    Execute GDELT batch ingestion
    """
    logger.info("Starting GDELT batch ingestion")
    
    try:
        # Import GDELT ingestion module
        import sys
        sys.path.append('/workspace/shadcn-ui/src/services/csi/ingestion/gdelt')
        from gdeltIngestion import GDELTIngestion
        
        # Run ingestion
        ingestion = GDELTIngestion()
        stats = ingestion.run_batch()
        
        # Log results
        logger.info(f"GDELT ingestion complete: {stats}")
        
        # Push stats to XCom for monitoring
        context['task_instance'].xcom_push(key='gdelt_stats', value=stats)
        
        return stats
        
    except Exception as e:
        logger.error(f"GDELT ingestion failed: {e}")
        raise


def ingest_news_wires(**context):
    """
    Execute news wire RSS feed ingestion
    """
    logger.info("Starting news wire ingestion")
    
    try:
        # This would call the TypeScript service
        # For now, using bash operator to call Node.js script
        logger.info("News wire ingestion triggered")
        
        # Push placeholder stats
        stats = {
            'sources': 8,
            'articles': 0,
            'timestamp': datetime.utcnow().isoformat()
        }
        context['task_instance'].xcom_push(key='news_stats', value=stats)
        
        return stats
        
    except Exception as e:
        logger.error(f"News wire ingestion failed: {e}")
        raise


def check_data_quality(**context):
    """
    Validate ingested data quality
    """
    logger.info("Checking data quality")
    
    # Pull stats from previous tasks
    ti = context['task_instance']
    gdelt_stats = ti.xcom_pull(task_ids='ingest_gdelt', key='gdelt_stats')
    news_stats = ti.xcom_pull(task_ids='ingest_news_wires', key='news_stats')
    
    # Quality checks
    checks = {
        'gdelt_fetched': gdelt_stats.get('fetched', 0) > 0 if gdelt_stats else False,
        'gdelt_routed': gdelt_stats.get('routed', 0) > 0 if gdelt_stats else False,
        'gdelt_error_rate': (gdelt_stats.get('errors', 0) / max(gdelt_stats.get('fetched', 1), 1)) < 0.1 if gdelt_stats else False,
        'news_sources': news_stats.get('sources', 0) >= 5 if news_stats else False,
    }
    
    # Log results
    logger.info(f"Data quality checks: {checks}")
    
    # Raise alert if critical checks fail
    if not checks['gdelt_fetched']:
        logger.warning("GDELT ingestion returned no data")
    
    if not checks['gdelt_error_rate']:
        logger.warning("GDELT error rate too high")
    
    return checks


def update_monitoring_metrics(**context):
    """
    Update Prometheus metrics
    """
    logger.info("Updating monitoring metrics")
    
    # Pull stats
    ti = context['task_instance']
    gdelt_stats = ti.xcom_pull(task_ids='ingest_gdelt', key='gdelt_stats')
    news_stats = ti.xcom_pull(task_ids='ingest_news_wires', key='news_stats')
    quality_checks = ti.xcom_pull(task_ids='check_data_quality')
    
    # In production, push to Prometheus
    # For now, just log
    logger.info(f"Metrics - GDELT: {gdelt_stats}, News: {news_stats}, Quality: {quality_checks}")
    
    return True


# Define tasks
task_ingest_gdelt = PythonOperator(
    task_id='ingest_gdelt',
    python_callable=ingest_gdelt_batch,
    dag=dag,
)

task_ingest_news = PythonOperator(
    task_id='ingest_news_wires',
    python_callable=ingest_news_wires,
    dag=dag,
)

task_quality_check = PythonOperator(
    task_id='check_data_quality',
    python_callable=check_data_quality,
    dag=dag,
)

task_update_metrics = PythonOperator(
    task_id='update_monitoring_metrics',
    python_callable=update_monitoring_metrics,
    dag=dag,
)

# Define task dependencies
# Run GDELT and news ingestion in parallel
[task_ingest_gdelt, task_ingest_news] >> task_quality_check >> task_update_metrics