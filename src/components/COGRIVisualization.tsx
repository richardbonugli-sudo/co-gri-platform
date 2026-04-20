import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
}

interface COGRIVisualizationProps {
  countryExposures: CountryExposure[];
  finalScore: number;
  riskLevel: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

export function COGRIVisualization({ countryExposures, finalScore, riskLevel }: COGRIVisualizationProps) {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  
  // Prepare data for bar chart (top 10 countries by contribution)
  const barChartData = [...countryExposures]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 10)
    .map(exp => ({
      country: exp.country,
      contribution: parseFloat(exp.contribution.toFixed(2)),
      riskLevel: parseFloat(exp.countryShockIndex.toFixed(1))
    }));

  // Prepare data for pie chart (exposure distribution)
  const pieChartData = [...countryExposures]
    .sort((a, b) => b.exposureWeight - a.exposureWeight)
    .slice(0, 8)
    .map(exp => ({
      name: exp.country,
      value: parseFloat((exp.exposureWeight * 100).toFixed(2))
    }));

  const getRiskColor = (level: string) => {
    if (level.includes('High')) return 'bg-orange-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    if (level.includes('Low')) return 'bg-green-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="inline-block">
              <div className={`${getRiskColor(riskLevel)} text-white px-6 py-3 rounded-lg`}>
                <div className="text-5xl font-bold mb-2">{finalScore}</div>
                <div className="text-lg font-semibold">{riskLevel}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Risk Contributions */}
      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <LensBadge lens={activeLens} />
          </div>
          <CardTitle className="text-white">Top Risk Contributors</CardTitle>
          <CardDescription className="text-gray-200">
            Countries with highest contribution to overall risk score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="country" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="contribution" fill="#0d5f5f" name="Risk Contribution" />
              <Bar dataKey="riskLevel" fill="#FF8042" name="Country Risk Level" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Exposure Distribution */}
      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Geographic Exposure Distribution</CardTitle>
          <CardDescription className="text-gray-200">
            Revenue exposure by country (top 8 markets)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}