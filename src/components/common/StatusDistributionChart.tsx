
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export enum Status {
  Quoting = 'Quoting',
  Confirmed = 'Confirmed',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered'
}

interface StatusDistribution {
  status: Status;
  count: number;
  color: string;
}

interface StatusDistributionChartProps {
  data: StatusDistribution[];
  total: number;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data, total }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{((item.count / total) * 100).toFixed(0)}%</span>
                <span className="text-muted-foreground">({item.count})</span>
              </div>
            </div>
            <Progress value={(item.count / total) * 100} className="h-2" style={{ backgroundColor: `${item.color}30` }}>
              <div className="h-full" style={{ backgroundColor: item.color }}></div>
            </Progress>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
