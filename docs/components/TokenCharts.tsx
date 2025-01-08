import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Colors } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

export const data = {
  labels: ['EFX Holders', 'NFX Holders', 'Staking Incentives', 'DAO Treasury', 'Liquidity & Parnterships', 'Development Fund', 'Migration Reserve'],
  datasets: [
    {
      label: 'Tokens',
      data: [185509140, 60636287, 50000000, 49049383, 68437032, 100000000, 6369158],
      borderWidth: 1,
    },
  ],
};

export function TokenDistributionPieChart() {
  return <Pie data={data} />;
}
