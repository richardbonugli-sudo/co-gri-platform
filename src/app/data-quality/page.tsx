import { EnhancedDataQualityDashboard } from '@/tools/data-quality/EnhancedDashboard';
import { DataQualityManualControls } from '@/tools/data-quality/ManualControls';

export default function DataQualityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Quality Management</h1>
        <p className="text-muted-foreground">
          Automated monthly updates and segment filtering for geographic exposure data
        </p>
      </div>
      
      <DataQualityManualControls />
      <EnhancedDataQualityDashboard />
    </div>
  );
}