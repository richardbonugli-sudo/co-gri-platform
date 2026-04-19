import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfusionMatrix, CSIRiskVector, CSIRiskVectorNames } from '@/types/audit.types';

interface RoutingAccuracyMatrixProps {
  confusionMatrix: ConfusionMatrix;
}

export function RoutingAccuracyMatrix({ confusionMatrix }: RoutingAccuracyMatrixProps) {
  const vectors = Object.values(CSIRiskVector);

  const getColorIntensity = (value: number, max: number) => {
    if (max === 0) return 'bg-gray-900';
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-green-500/80';
    if (intensity > 0.6) return 'bg-green-500/60';
    if (intensity > 0.4) return 'bg-green-500/40';
    if (intensity > 0.2) return 'bg-green-500/20';
    if (intensity > 0) return 'bg-green-500/10';
    return 'bg-gray-900';
  };

  return (
    <Card className="border-gray-800">
      <CardHeader>
        <CardTitle>Routing Confusion Matrix</CardTitle>
        <CardDescription>
          Rows: Expected vector | Columns: Actual routed vector | Diagonal: Correct routing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-800 p-2 text-left text-sm font-medium text-gray-400">
                  Expected →<br />Actual ↓
                </th>
                {vectors.map(v => (
                  <th
                    key={v}
                    className="border border-gray-800 p-2 text-center text-xs font-medium text-gray-400"
                  >
                    {CSIRiskVectorNames[v].split(' ')[0]}
                  </th>
                ))}
                <th className="border border-gray-800 p-2 text-center text-xs font-medium text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {vectors.map(expectedVector => {
                const rowTotal = confusionMatrix.row_totals[expectedVector];
                const maxInRow = Math.max(...vectors.map(v => confusionMatrix.matrix[expectedVector][v]));

                return (
                  <tr key={expectedVector}>
                    <td className="border border-gray-800 p-2 text-sm font-medium text-gray-400">
                      {CSIRiskVectorNames[expectedVector].split(' ')[0]}
                    </td>
                    {vectors.map(actualVector => {
                      const value = confusionMatrix.matrix[expectedVector][actualVector];
                      const isDiagonal = expectedVector === actualVector;
                      const colorClass = isDiagonal
                        ? getColorIntensity(value, maxInRow)
                        : value > 0
                        ? 'bg-red-500/20'
                        : 'bg-gray-900';

                      return (
                        <td
                          key={actualVector}
                          className={`border border-gray-800 p-2 text-center text-sm ${colorClass}`}
                        >
                          {value > 0 ? value : '-'}
                        </td>
                      );
                    })}
                    <td className="border border-gray-800 p-2 text-center text-sm font-medium">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="border border-gray-800 p-2 text-sm font-medium text-gray-400">
                  Total
                </td>
                {vectors.map(v => (
                  <td
                    key={v}
                    className="border border-gray-800 p-2 text-center text-sm font-medium"
                  >
                    {confusionMatrix.column_totals[v]}
                  </td>
                ))}
                <td className="border border-gray-800 p-2 text-center text-sm font-medium">
                  {Object.values(confusionMatrix.row_totals).reduce((a, b) => a + b, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {vectors.map(v => (
            <div key={v} className="flex justify-between">
              <span className="text-gray-400">{CSIRiskVectorNames[v].split(' ')[0]}:</span>
              <span className="font-medium">
                Precision: {(confusionMatrix.precision[v] * 100).toFixed(1)}% |
                Recall: {(confusionMatrix.recall[v] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}