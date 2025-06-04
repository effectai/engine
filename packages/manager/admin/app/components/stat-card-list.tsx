import { Badge } from "~/components/ui/badge";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export type Stats = {
  title: string;
  value: string | number;
};

export default function StatCardList({ stats }: { stats: Stats[] }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((stat) => (
        <Card className="@container/card" key={stat.title}>
          <CardHeader>
            <CardDescription>{stat.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stat.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
