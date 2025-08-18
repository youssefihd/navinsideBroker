import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Box, Truck, Users, Package } from "lucide-react";
import { Checkbox } from "@radix-ui/react-checkbox";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import DashboardActivity from './DashboardAtivity';
import LostLoads from './LostLoads';

interface Stat {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface Activity {
  action: string;
  timestamp: string;
}

const Index = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const { t } = useTranslation();


  useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => {
        const iconMap = {
          Charges: Box,
          Clients: Users,
          Transporteurs: Truck,
          Équipements: Package,
        };
        const enrichedStats = res.data.map((s: any) => ({
          ...s,
          icon: iconMap[s.title] || Box
        }));
        setStats(enrichedStats);
      })
      .catch(console.error);

    api.get("/dashboard/activities")
      .then(res => setActivities(res.data))
      .catch(console.error);
  }, []);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      setTodos(prev => [...prev, newTodo.trim()]);
      setNewTodo("");
    }
  };

  const handleToggleTodo = (index: number) => {
    setTodos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-muted-foreground">
        {t("dashboard_welcome")}
        </p>
      </div>

      {/* Dynamic Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activities + Todo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recent_activity")}</CardTitle>
            <CardDescription>
            {t("recent_activity_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardActivity />
            {/* <div className="space-y-4"> */}
            {/* {activities.map((activity, index) => (
  <div key={index} className="flex items-center space-x-4">
    <div className="w-2 h-2 bg-logistics-500 rounded-full" />
    <div className="flex-1">
      <p className="text-sm">{activity.action}</p>
      <p className="text-xs text-muted-foreground">
        {activity.timestamp
          ? format(parseISO(activity.timestamp), "dd/MM/yyyy HH:mm")
          : "Date inconnue"}
      </p>
    </div>
  </div>
))}
</div> */}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>{t("todo_today")}</CardTitle>
            <CardDescription>{t("todo_attention")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="flex-1 border rounded px-2 py-1"
                  placeholder={t("add_task_placeholder")}
                />
                <button
                  onClick={handleAddTodo}
                  className="bg-primary text-white px-3 py-1 rounded"
                >
               {t("add")}
                </button>
              </div>

              {todos.map((task, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadixCheckbox.Root
                    className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center"
                    onCheckedChange={() => handleToggleTodo(index)}
                  >
                    <Checkbox>
                      <Checkbox className="w-4 h-4 text-primary" />
                    </Checkbox>
                  </RadixCheckbox.Root>
                  <span className="text-sm">{task}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
        <LostLoads />
      </div>
    </div>
  );
};

export default Index;
