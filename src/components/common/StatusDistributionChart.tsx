
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { GaugeCircle } from 'lucide-react';

export enum Status {
  Quoting = 'Quoting',
  Confirmed = 'Confirmed',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
  Lost = 'Lost',
  Canceled = 'Canceled',
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
  // Transform data for the PieChart
  const chartData = data.map(item => ({
    name: item.status,
    value: item.count,
    color: item.color,
    percentage: ((item.count / total) * 100).toFixed(0) + '%'
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GaugeCircle className="h-4 w-4" />
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ChartContainer
            config={{
              status: { label: "Status" }
            }}
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ percentage }) => `${percentage}`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(0)}%)`, name]} 
                  />
                } 
              />
            </PieChart>
          </ChartContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.status}</span>
              <span className="font-medium ml-auto">{((item.count / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
