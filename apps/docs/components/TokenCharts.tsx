import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

export const data = {
  labels: [
    "EFX Holders",
    "NFX Holders",
    "Staking Incentives",
    "DAO Treasury",
    "Liquidity & Partnerships",
    "Development Fund",
    "Migration Reserve",
  ],
  datasets: [
    {
      label: "Tokens",
      data: [
        185509140, 60636287, 50000000, 49049383, 68437032, 100000000, 6368158,
      ],
      borderWidth: 1,
      backgroundColor: [
        "rgba(0, 71, 171, 0.2)", // Deep blue
        "rgba(147, 112, 219, 0.2)", // Purple
        "rgba(25, 25, 112, 0.2)", // Midnight blue
        "rgba(147, 197, 253, 0.2)", // Sky blue
        "rgba(75, 0, 130, 0.2)", // Indigo
        "rgba(138, 143, 226, 0.2)", // Periwinkle
        "rgba(65, 105, 225, 0.2)", // Royal blue
      ],
      borderColor: [
        "rgba(0, 71, 171, 1)", // Deep blue
        "rgba(147, 112, 219, 1)", // Purple
        "rgba(25, 25, 112, 1)", // Midnight blue
        "rgba(147, 197, 253, 1)", // Sky blue
        "rgba(75, 0, 130, 1)", // Indigo
        "rgba(138, 143, 226, 1)", // Periwinkle
        "rgba(65, 105, 225, 1)", // Royal blue
      ],
    },
  ],
};

export function TokenDistributionPieChart() {
  return <Pie data={data} />;
}
