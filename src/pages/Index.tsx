
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Truck, Users, Package, Briefcase } from 'lucide-react';

const Index = () => {
  const stats = [
    {
      title: 'Charges',
      value: '154',
      description: '12 en cours',
      icon: Box,
      color: 'text-blue-600',
    },
    {
      title: 'Clients',
      value: '24',
      description: '3 nouveaux ce mois',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Transporteurs',
      value: '18',
      description: '2 actifs aujourd\'hui',
      icon: Truck,
      color: 'text-purple-600',
    },
    {
      title: 'Équipements',
      value: '87',
      description: '72 disponibles',
      icon: Package,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre système de gestion logistique.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Les dernières opérations effectuées sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Charge LD-2023-005 créée', 
                'Nouveau client ajouté', 
                'Charge LD-2023-002 livrée',
                'Maintenance d\'équipement planifiée'
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-logistics-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">{activity}</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>À faire aujourd'hui</CardTitle>
            <CardDescription>
              Tâches qui requièrent votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Confirmer la charge LD-2023-003', 
                'Mettre à jour les informations du transporteur Transport Express', 
                'Planifier la livraison pour le client Durand & Fils',
                'Vérifier la disponibilité des équipements'
              ].map((task, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-5 h-5 border rounded flex items-center justify-center">
                    <div className="w-3 h-3 bg-white" />
                  </div>
                  <p className="text-sm">{task}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
