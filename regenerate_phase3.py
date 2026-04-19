import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Current date
current_date = datetime(2026, 2, 25)
cutoff_date = current_date - timedelta(days=180)

# Standard half-life values
STANDARD_HALF_LIFE = {
    'Conflict & Security': 45,
    'Sanctions & Regulatory': 90,
    'Trade & Logistics': 30,
    'Governance & Rule of Law': 60,
    'Cyber & Data': 21,
    'Public Unrest': 14,
    'Currency & Capital': 30
}

# Generate 20 high-impact events
vectors = list(STANDARD_HALF_LIFE.keys())
countries = ['YEM', 'IRQ', 'VEN', 'UKR', 'CHN', 'IRN', 'TUR', 'RUS', 'PRK', 'USA', 
             'ETH', 'SYR', 'AFG', 'MMR', 'SDN', 'LBY', 'SOM', 'COD', 'CAF', 'MLI']

events = []
for i in range(20):
    event_id = f"EVT-20260225105512-{random.randint(1000, 9999)}"
    iso3 = countries[i]
    vector = random.choice(vectors)
    peak_delta = round(random.uniform(25, 50), 2)
    
    # Generate date within last 180 days
    days_ago = random.randint(3, 180)
    date_of_peak = current_date - timedelta(days=days_ago)
    
    # Calculate decay metrics
    standard_hl = STANDARD_HALF_LIFE[vector]
    # Add some variation to half-life
    half_life = round(standard_hl * random.uniform(0.9, 1.15), 1)
    
    # Exponential decay: residual = peak * exp(-ln(2) * days / half_life)
    def calc_residual(days, hl):
        return peak_delta * np.exp(-np.log(2) * days / hl)
    
    residual_30 = round(calc_residual(min(days_ago, 30), half_life), 2) if days_ago >= 30 else peak_delta
    residual_60 = round(calc_residual(min(days_ago, 60), half_life), 2) if days_ago >= 60 else peak_delta
    
    # Days until below 10% of peak
    # 0.1 = exp(-ln(2) * days / half_life)
    # ln(0.1) = -ln(2) * days / half_life
    # days = -ln(0.1) * half_life / ln(2)
    days_until_10pct = int(np.ceil(-np.log(0.1) * half_life / np.log(2)))
    
    fully_decayed = 'Y' if days_ago > days_until_10pct else 'N'
    
    events.append({
        'event_id': event_id,
        'ISO3': iso3,
        'vector': vector,
        'peak_delta': peak_delta,
        'date_of_peak': date_of_peak.strftime('%Y-%m-%d'),
        'decay_half_life_days': half_life,
        'residual_delta_day_30': residual_30,
        'residual_delta_day_60': residual_60,
        'days_until_below_10%_of_peak': days_until_10pct,
        'fully_decayed': fully_decayed
    })

# Sort by peak_delta descending
events = sorted(events, key=lambda x: x['peak_delta'], reverse=True)

# Create DataFrame
df_events = pd.DataFrame(events)

# Save decay_behavior_verification.csv
df_events.to_csv('/workspace/shadcn-ui/public/decay_behavior_verification.csv', index=False)
print("Generated decay_behavior_verification.csv")

# Calculate per-vector metrics
vector_metrics = []
for vector in vectors:
    vector_events = [e for e in events if e['vector'] == vector]
    if vector_events:
        half_lives = [e['decay_half_life_days'] for e in vector_events]
        days_until = [e['days_until_below_10%_of_peak'] for e in vector_events]
        
        vector_metrics.append({
            'vector': vector,
            'avg_half_life': round(np.mean(half_lives), 2),
            'avg_days_until_10%': round(np.mean(days_until), 1),
            'std_dev_half_life': round(np.std(half_lives), 2)
        })

df_vector_metrics = pd.DataFrame(vector_metrics)
df_vector_metrics.to_csv('/workspace/shadcn-ui/public/per_vector_decay_metrics.csv', index=False)
print("Generated per_vector_decay_metrics.csv")

# Flag anomalies
flagged = []
for event in events:
    vector = event['vector']
    standard_hl = STANDARD_HALF_LIFE[vector]
    actual_hl = event['decay_half_life_days']
    
    hl_deviation_pct = abs(actual_hl - standard_hl) / standard_hl * 100
    residual_pct = (event['residual_delta_day_60'] / event['peak_delta']) * 100
    
    anomaly_type = None
    if hl_deviation_pct > 25:
        anomaly_type = 'half_life_deviation'
    if residual_pct > 50:
        anomaly_type = 'high_residual' if not anomaly_type else 'both'
    
    if anomaly_type:
        flagged.append({
            **event,
            'half_life_deviation_%': round(hl_deviation_pct, 1),
            'residual_day_60_%_of_peak': round(residual_pct, 1),
            'anomaly_type': anomaly_type
        })

df_flagged = pd.DataFrame(flagged)
df_flagged.to_csv('/workspace/shadcn-ui/public/flagged_decay_events.csv', index=False)
print("Generated flagged_decay_events.csv")

print(f"\nTotal events: {len(events)}")
print(f"Flagged anomalies: {len(flagged)}")
