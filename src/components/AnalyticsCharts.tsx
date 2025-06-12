import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Types pour les données de graphiques
interface DailyProgressData {
  date: string;
  quotes_read: number;
  reading_time: number;
  favorites_added: number;
  sessions: number;
}

interface CategoryData {
  category: string;
  count: number;
  time: number;
  color: string;
}

interface AnalyticsChartsProps {
  userId?: string;
  timeFilter?: 'week' | 'month' | 'year';
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ 
  userId, 
  timeFilter = 'month' 
}) => {
  const [dailyData, setDailyData] = useState<DailyProgressData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Générer des données de démonstration réalistes
  const generateDemoData = () => {
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
    const today = new Date();
    
    // Données quotidiennes
    const dailyProgress: DailyProgressData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulation de données avec tendances réalistes
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseActivity = isWeekend ? 0.7 : 1;
      const randomFactor = 0.5 + Math.random() * 1;
      
      dailyProgress.push({
        date: date.toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        quotes_read: Math.round(baseActivity * randomFactor * (3 + Math.random() * 7)),
        reading_time: Math.round(baseActivity * randomFactor * (5 + Math.random() * 25)),
        favorites_added: Math.round(baseActivity * randomFactor * Math.random() * 3),
        sessions: Math.round(baseActivity * randomFactor * (1 + Math.random() * 2))
      });
    }
    
    // Données par catégorie
    const categories: CategoryData[] = [
      { category: 'Sagesse', count: 45, time: 120, color: '#3B82F6' },
      { category: 'Spiritualité', count: 38, time: 95, color: '#10B981' },
      { category: 'Réflexion', count: 32, time: 85, color: '#F59E0B' },
      { category: 'Action', count: 28, time: 70, color: '#EF4444' },
      { category: 'Objectifs', count: 22, time: 55, color: '#8B5CF6' },
      { category: 'Motivation', count: 18, time: 45, color: '#EC4899' }
    ];
    
    return { dailyProgress, categories };
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Simulation du chargement
    setTimeout(() => {
      const { dailyProgress, categories } = generateDemoData();
      setDailyData(dailyProgress);
      setCategoryData(categories);
      setIsLoading(false);
    }, 800);
  }, [timeFilter]);

  // Composant de loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'reading_time' && 'min'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Progression quotidienne - Courbe */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            📈 Progression de lecture
          </h3>
          <p className="text-sm text-gray-500">
            Évolution quotidienne de votre activité de lecture
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="quotes_read" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                name="Citations lues"
              />
              <Line 
                type="monotone" 
                dataKey="reading_time" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                name="Temps de lecture"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par catégories - Barres et Camembert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique en barres */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              📊 Citations par catégorie
            </h3>
            <p className="text-sm text-gray-500">
              Répartition de vos lectures par thème
            </p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="category" 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  name="Citations"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique camembert */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              🎯 Temps par catégorie
            </h3>
            <p className="text-sm text-gray-500">
              Répartition du temps de lecture
            </p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="time"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} min`, 'Temps']}
                  labelFormatter={(label: any) => `Catégorie: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Légende personnalisée */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 truncate">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métriques d'engagement - Barres empilées */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ⚡ Engagement quotidien
          </h3>
          <p className="text-sm text-gray-500">
            Sessions, favoris et bookmarks par jour
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sessions" 
                stackId="a"
                fill="#3B82F6"
                radius={[0, 0, 0, 0]}
                name="Sessions"
              />
              <Bar 
                dataKey="favorites_added" 
                stackId="a"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Favoris ajoutés"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicateurs de tendance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📊 Tendances récentes
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">+23%</div>
            <div className="text-sm text-gray-600">Temps de lecture</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+15%</div>
            <div className="text-sm text-gray-600">Citations lues</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">+8%</div>
            <div className="text-sm text-gray-600">Favoris ajoutés</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">5j</div>
            <div className="text-sm text-gray-600">Série actuelle</div>
            <div className="text-xs text-blue-600">jours consécutifs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;