"""
GDELT Data Ingestion Pipeline

Fetches and processes GDELT Global Events Database (15-minute updates)
Maps CAMEO event codes to CSI risk vectors
Sends structured events to Kafka for downstream processing

GDELT provides ~10,000 events/day across 195 countries
"""

import requests
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from io import BytesIO
import zipfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GDELTIngestion:
    """
    GDELT data ingestion and processing pipeline
    """
    
    BASE_URL = "http://data.gdeltproject.org/gdeltv2/"
    
    # GDELT column names (27 core columns)
    COLUMN_NAMES = [
        'GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate',
        'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode',
        'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code',
        'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code',
        'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode',
        'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code',
        'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code',
        'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode',
        'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources',
        'NumArticles', 'AvgTone', 'Actor1Geo_Type', 'Actor1Geo_FullName',
        'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_Lat',
        'Actor1Geo_Long', 'Actor1Geo_FeatureID', 'Actor2Geo_Type',
        'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code',
        'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID',
        'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode',
        'ActionGeo_ADM1Code', 'ActionGeo_Lat', 'ActionGeo_Long',
        'ActionGeo_FeatureID', 'DATEADDED', 'SOURCEURL'
    ]
    
    def __init__(self, kafka_producer=None):
        """
        Initialize GDELT ingestion pipeline
        
        Args:
            kafka_producer: Optional Kafka producer for streaming events
        """
        self.kafka_producer = kafka_producer
        self.stats = {
            'fetched': 0,
            'parsed': 0,
            'routed': 0,
            'errors': 0
        }
    
    def fetch_latest_batch(self) -> Optional[pd.DataFrame]:
        """
        Fetch the latest 15-minute batch from GDELT
        
        GDELT updates every 15 minutes with filename format:
        YYYYMMDDHHMMSS.export.CSV.zip
        
        Returns:
            DataFrame with parsed GDELT events, or None if fetch fails
        """
        try:
            # Calculate the timestamp for the last 15-minute window
            now = datetime.utcnow()
            # Round down to nearest 15 minutes
            minutes = (now.minute // 15) * 15
            batch_time = now.replace(minute=minutes, second=0, microsecond=0)
            
            # Try current and previous batch (in case of delay)
            for offset in [0, -15]:
                target_time = batch_time + timedelta(minutes=offset)
                filename = f"{target_time.strftime('%Y%m%d%H%M%S')}.export.CSV.zip"
                url = f"{self.BASE_URL}{filename}"
                
                logger.info(f"Attempting to fetch GDELT batch: {filename}")
                
                try:
                    response = requests.get(url, timeout=60)
                    if response.status_code == 200:
                        logger.info(f"Successfully fetched {filename}")
                        return self._parse_gdelt_zip(response.content)
                except requests.RequestException as e:
                    logger.warning(f"Failed to fetch {filename}: {e}")
                    continue
            
            logger.error("Could not fetch any recent GDELT batch")
            return None
            
        except Exception as e:
            logger.error(f"Error in fetch_latest_batch: {e}")
            self.stats['errors'] += 1
            return None
    
    def _parse_gdelt_zip(self, zip_content: bytes) -> pd.DataFrame:
        """
        Parse GDELT ZIP file content into DataFrame
        
        Args:
            zip_content: Raw ZIP file bytes
            
        Returns:
            Parsed DataFrame
        """
        try:
            with zipfile.ZipFile(BytesIO(zip_content)) as z:
                # Get the CSV filename (should be only file in zip)
                csv_filename = z.namelist()[0]
                
                # Read CSV with tab delimiter
                with z.open(csv_filename) as csv_file:
                    df = pd.read_csv(
                        csv_file,
                        sep='\t',
                        header=None,
                        names=self.COLUMN_NAMES,
                        dtype=str,
                        na_values=[''],
                        low_memory=False
                    )
                    
                    self.stats['fetched'] = len(df)
                    logger.info(f"Parsed {len(df)} events from GDELT batch")
                    return df
                    
        except Exception as e:
            logger.error(f"Error parsing GDELT ZIP: {e}")
            self.stats['errors'] += 1
            return pd.DataFrame()
    
    def parse_gdelt_events(self, df: pd.DataFrame) -> List[Dict]:
        """
        Parse GDELT DataFrame into structured event objects
        
        Args:
            df: GDELT DataFrame
            
        Returns:
            List of structured event dictionaries
        """
        events = []
        
        for idx, row in df.iterrows():
            try:
                event = {
                    'event_id': row['GLOBALEVENTID'],
                    'event_date': row['SQLDATE'],
                    'event_code': row['EventCode'],
                    'event_base_code': row['EventBaseCode'],
                    'event_root_code': row['EventRootCode'],
                    'actor1_country': row['Actor1CountryCode'],
                    'actor1_name': row['Actor1Name'],
                    'actor2_country': row['Actor2CountryCode'],
                    'actor2_name': row['Actor2Name'],
                    'action_country': row['ActionGeo_CountryCode'],
                    'action_location': row['ActionGeo_FullName'],
                    'goldstein_scale': float(row['GoldsteinScale']) if pd.notna(row['GoldsteinScale']) else 0.0,
                    'num_mentions': int(row['NumMentions']) if pd.notna(row['NumMentions']) else 0,
                    'num_sources': int(row['NumSources']) if pd.notna(row['NumSources']) else 0,
                    'num_articles': int(row['NumArticles']) if pd.notna(row['NumArticles']) else 0,
                    'avg_tone': float(row['AvgTone']) if pd.notna(row['AvgTone']) else 0.0,
                    'source_url': row['SOURCEURL'],
                    'date_added': row['DATEADDED']
                }
                
                # Route to CSI vectors
                vector_info = self.route_to_vectors(event)
                if vector_info:
                    event.update(vector_info)
                    events.append(event)
                    self.stats['routed'] += 1
                
                self.stats['parsed'] += 1
                
            except Exception as e:
                logger.warning(f"Error parsing event {idx}: {e}")
                self.stats['errors'] += 1
                continue
        
        logger.info(f"Successfully parsed {len(events)} events with vector routing")
        return events
    
    def route_to_vectors(self, event: Dict) -> Optional[Dict]:
        """
        Map GDELT CAMEO event codes to CSI risk vectors
        
        CAMEO (Conflict and Mediation Event Observations) codes:
        - 01-05: Verbal cooperation
        - 06-09: Material cooperation
        - 10-13: Verbal conflict
        - 14-19: Material conflict
        - 20: Mass violence
        
        Args:
            event: Parsed GDELT event
            
        Returns:
            Dictionary with vector routing info, or None if not relevant
        """
        event_code = event.get('event_code', '')
        event_root = event.get('event_root_code', '')
        goldstein = event.get('goldstein_scale', 0.0)
        
        # Extract first 2 digits for category
        try:
            code_category = int(event_code[:2]) if len(event_code) >= 2 else 0
        except (ValueError, TypeError):
            return None
        
        # Vector routing based on CAMEO codes
        vector_mapping = {
            # SC1: Conflict & Military Action (14-20)
            14: 'SC1',  # Protest
            15: 'SC1',  # Exhibit force posture
            16: 'SC1',  # Reduce relations
            17: 'SC1',  # Coerce
            18: 'SC1',  # Assault
            19: 'SC1',  # Fight
            20: 'SC1',  # Use unconventional mass violence
            
            # SC2: Sanctions & Regulatory (specific sub-codes)
            # Handled by keyword matching in sub-codes
            
            # SC3: Trade & Economic (06, 16)
            6: 'SC3',   # Engage in material cooperation
            
            # SC4: Governance & Political (10-13)
            10: 'SC4',  # Demand
            11: 'SC4',  # Disapprove
            12: 'SC4',  # Reject
            13: 'SC4',  # Threaten
            
            # SC6: Social Unrest (14)
            # Already mapped to SC1, but check for protest-specific
        }
        
        primary_vector = vector_mapping.get(code_category)
        
        # Severity estimation based on Goldstein scale
        # Goldstein ranges from -10 (most conflictual) to +10 (most cooperative)
        severity = max(1, min(10, int(5 - goldstein / 2)))
        
        # Credibility based on number of sources
        num_sources = event.get('num_sources', 1)
        credibility = min(0.9, 0.3 + (num_sources * 0.1))
        
        if primary_vector:
            return {
                'vector_primary': primary_vector,
                'vector_confidence': credibility,
                'severity_initial': severity,
                'signal_type': f'GDELT_{event_root}',
                'routing_method': 'CAMEO_mapping'
            }
        
        # If no clear vector, check if high-impact event
        if abs(goldstein) > 5 and num_sources >= 3:
            # High-impact event, route based on tone
            if goldstein < -5:
                return {
                    'vector_primary': 'SC1',
                    'vector_confidence': credibility,
                    'severity_initial': severity,
                    'signal_type': 'GDELT_high_impact',
                    'routing_method': 'goldstein_threshold'
                }
        
        return None
    
    def send_to_kafka(self, events: List[Dict], topic: str = 'gdelt-events'):
        """
        Send parsed events to Kafka topic
        
        Args:
            events: List of structured events
            topic: Kafka topic name
        """
        if not self.kafka_producer:
            logger.warning("No Kafka producer configured, skipping send")
            return
        
        for event in events:
            try:
                # Serialize to JSON
                message = json.dumps(event)
                
                # Send to Kafka
                self.kafka_producer.send(topic, message)
                
            except Exception as e:
                logger.error(f"Error sending event to Kafka: {e}")
                self.stats['errors'] += 1
    
    def run_batch(self) -> Dict:
        """
        Execute a complete ingestion batch
        
        Returns:
            Statistics dictionary
        """
        logger.info("Starting GDELT batch ingestion")
        
        # Reset stats
        self.stats = {
            'fetched': 0,
            'parsed': 0,
            'routed': 0,
            'errors': 0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Fetch latest batch
        df = self.fetch_latest_batch()
        if df is None or df.empty:
            logger.warning("No data fetched from GDELT")
            return self.stats
        
        # Parse events
        events = self.parse_gdelt_events(df)
        
        # Send to Kafka
        if events:
            self.send_to_kafka(events)
        
        logger.info(f"Batch complete: {self.stats}")
        return self.stats


def main():
    """
    Main entry point for GDELT ingestion
    """
    # Initialize ingestion pipeline
    ingestion = GDELTIngestion()
    
    # Run batch
    stats = ingestion.run_batch()
    
    print(f"GDELT Ingestion Complete:")
    print(f"  Fetched: {stats['fetched']}")
    print(f"  Parsed: {stats['parsed']}")
    print(f"  Routed: {stats['routed']}")
    print(f"  Errors: {stats['errors']}")


if __name__ == '__main__':
    main()