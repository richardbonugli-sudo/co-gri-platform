#!/usr/bin/env python3
"""
Phase 2: Expectation Weighting - Flagged Events Generator
Analyzes expectation_weighting_verification.csv and includes ALL events with their error percentages
"""

import csv
import os

def generate_flagged_events():
    """Generate flagged_events.csv from expectation_weighting_verification.csv"""
    
    input_file = '/workspace/shadcn-ui/public/expectation_weighting_verification.csv'
    output_file = '/workspace/shadcn-ui/public/flagged_events.csv'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found")
        return
    
    flagged_events = []
    
    # Read verification CSV and calculate error percentages for ALL events
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # Parse numeric values
                expected_delta = float(row['expected_delta'])
                residual_error = float(row['residual_error'])
                
                # Calculate error percentage
                if expected_delta != 0:
                    error_percentage = (abs(residual_error) / expected_delta) * 100
                else:
                    error_percentage = 0.0
                
                # Include ALL events (no filtering)
                flagged_event = {
                    'event_id': row['event_id'],
                    'ISO3': row['ISO3'],
                    'vector': row['vector'],
                    'raw_delta': row['raw_delta'],
                    'probability_assigned': row['probability_assigned'],
                    'severity_score': row['severity_score'],
                    'relevance_weight': row['relevance_weight'],
                    'expected_delta': row['expected_delta'],
                    'applied_delta': row['applied_delta'],
                    'residual_error': row['residual_error'],
                    'error_percentage': f"{error_percentage:.2f}"
                }
                flagged_events.append(flagged_event)
            
            except (ValueError, KeyError) as e:
                print(f"Warning: Skipping row due to error: {e}")
                continue
    
    # Write all events to CSV
    fieldnames = [
        'event_id', 'ISO3', 'vector', 'raw_delta', 'probability_assigned',
        'severity_score', 'relevance_weight', 'expected_delta', 'applied_delta',
        'residual_error', 'error_percentage'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flagged_events)
    
    print(f"✓ Generated {output_file}")
    print(f"✓ Total events included: {len(flagged_events)}")
    print(f"✓ All events now include error_percentage column")
    
    # Count events exceeding 5% threshold for informational purposes
    high_error_count = sum(1 for e in flagged_events if float(e['error_percentage']) > 5.0)
    print(f"✓ Events with error > 5%: {high_error_count}")
    print(f"✓ Events with error <= 5%: {len(flagged_events) - high_error_count}")

if __name__ == '__main__':
    generate_flagged_events()
