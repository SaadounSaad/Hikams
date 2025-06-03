// src/pages/AnalyticsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Heart, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Activity,
  Star,
  Search,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Eye,
  Timer,
  Award,
  Bookmark,
  RefreshCw
} from 'lucide-react';
import { useAnalytics, useAnalyticsKPIs } from '../context/AnalyticsContext';
import { useQuotes } from '../context/QuoteContext';

// Types pour les données du tableau de bord
interface DashboardStats {
  totalSessions: number;
  avgSessionDuration: number;
  quotesRead: number;
  avgReadingTime: number;
  favoritesAdded: number;
  topCategory: string;
  totalBookmarks: number;
  searchQueries: number;
}

interface CategoryStats {
  category: string;
  views: number;
  percentage: number;
  color: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  category?: string;
}

// Composant pour une carte de statistique
const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  color = "blue",
  isLoading = false
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; type: 'up' | 'down' };
  color?: string;
  isLoading?: boolean;
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses['blue']}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            trend.type === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${trend.type === 'down' ? 'rotate-180' : ''}`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// Composant pour le graphique des catégories
const CategoryChart = ({ data, isLoading }: { data: CategoryStats[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <PieChart className="w-5 h-5 mr-2 text-purple-600" />
        Citations par Catégorie
      </h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-700 font-arabic">
                {item.category}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{item.views}</span>
              <span className="text-xs text-gray-400">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant principal du tableau de bord
const AnalyticsPage = () => {
  const { analytics, trackEvent } = useAnalytics(); // ✅ Maintenant on a accès au service
  const { getKPIs, isAvailable } = useAnalyticsKPIs(); // ✅ Hook pour les KPIs
  const { quotes } = useQuotes();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    avgSessionDuration: 0,
    quotesRead: 0,
    avgReadingTime: 0,
    favoritesAdded: 0,
    topCategory: '',
    totalBookmarks: 0,
    searchQueries: 0
  });
  const [error, setError] = useState<string | null>(null);

  // Calculer les catégories depuis les quotes existantes
  const categoryData = useMemo(() => {
    const categoryCount = quotes.reduce((acc, quote) => {
      const category = getCategoryDisplayName(quote.category);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

    return Object.entries(categoryCount)
      .map(([category, count], index) => ({
        category,
        views: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [quotes]);

  // Fonction pour obtenir le nom d'affichage des catégories
  function getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      'daily': 'حكمة اليوم',
      'favorites': 'المفضلة',
      'verses': 'آيات مِفتاحية',
      'hadiths': 'هَدْي نَبَوي',
      'thoughts': 'دُرَرْ',
      'mukhtarat': 'عٌدَّة المريد',
      'miraj-arwah': 'معراج الأرواح'
    };
    return categoryNames[category] || category;
  }

  // Charger les données du tableau de bord
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculer les dates selon la période sélectionnée
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      // ✅ NOUVEAU: Essayer de récupérer les vraies données via AnalyticsService
      if (isAvailable && analytics) {
        try {
          const kpis = await getKPIs(startDate, endDate);
          
          if (kpis) {
            setStats({
              totalSessions: kpis.sessions || 0,
              avgSessionDuration: kpis.avg_session_duration || 0,
              quotesRead: kpis.quotes_read || 0,
              avgReadingTime: kpis.avg_reading_time || 0,
              favoritesAdded: kpis.favorites_added || 0,
              topCategory: getCategoryDisplayName(kpis.top_category || ''),
              totalBookmarks: 0, // À calculer séparément si besoin
              searchQueries: 0   // À calculer séparément si besoin
            });
            
            console.log('📊 Vraies données KPIs chargées:', kpis);
          } else {
            // Fallback vers les données calculées
            setStats(calculateStatsFromQuotes());
            console.log('📊 Utilisation des données calculées (pas de KPIs)');
          }
        } catch (apiError) {
          console.warn('⚠️ Analytics API erreur, utilisation des données locales:', apiError);
          setStats(calculateStatsFromQuotes());
        }
      } else {
        console.log('📊 Analytics service non disponible, utilisation des données calculées');
        setStats(calculateStatsFromQuotes());
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
      setStats(calculateStatsFromQuotes());
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les stats basées sur les quotes existantes (fallback)
  const calculateStatsFromQuotes = (): DashboardStats => {
    const totalQuotes = quotes.length;
    const favoritesCount = quotes.filter(q => q.isFavorite).length;
    const topCategory = categoryData[0]?.category || '';
    
    // Simuler des données réalistes basées sur la période
    const multiplier = dateRange === '30d' ? 1 : dateRange === '7d' ? 0.4 : 0.1;
    
    return {
      totalSessions: Math.max(1, Math.floor(totalQuotes * 0.3 * multiplier)),
      avgSessionDuration: 8.5,
      quotesRead: Math.floor(totalQuotes * 0.6 * multiplier),
      avgReadingTime: 2.3,
      favoritesAdded: Math.floor(favoritesCount * multiplier),
      topCategory,
      totalBookmarks: Math.floor(favoritesCount * 0.5 * multiplier),
      searchQueries: Math.floor(totalQuotes * 0.1 * multiplier)
    };
  };

  // Calculer les métriques dérivées
  const derivedMetrics = useMemo(() => {
    return {
      quotesPerSession: stats.totalSessions > 0 ? (stats.quotesRead / stats.totalSessions).toFixed(1) : '0',
      favoriteRate: stats.quotesRead > 0 ? ((stats.favoritesAdded / stats.quotesRead) * 100).toFixed(1) : '0',
      totalEngagement: stats.quotesRead + stats.favoritesAdded + stats.searchQueries + stats.totalBookmarks
    };
  }, [stats]);

  // Activités récentes simulées
  const recentActivities: RecentActivity[] = useMemo(() => {
    const activities = [
      {
        id: '1',
        type: 'favorite_added',
        description: 'Citation ajoutée aux favoris',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        category: stats.topCategory
      },
      {
        id: '2',
        type: 'search_performed',
        description: 'Recherche effectuée',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        category: 'عٌدَّة المريد'
      },
      {
        id: '3',
        type: 'bookmark_created',
        description: 'Signet créé automatiquement',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        category: 'آيات مِفتاحية'
      },
      {
        id: '4',
        type: 'category_changed',
        description: 'Navigation vers une nouvelle catégorie',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        category: 'هَدْي نَبَوي'
      }
    ];
    return activities;
  }, [stats.topCategory]);

  // Charger les données au montage et lors du changement de période
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, analytics, quotes, isAvailable]); // ✅ Ajout des nouvelles dépendances

  // Fonction pour formater le temps
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffMins < 1440) return `il y a ${Math.floor(diffMins / 60)}h`;
    return `il y a ${Math.floor(diffMins / 1440)}j`;
  };

  // Fonction pour obtenir l'icône d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quote_viewed': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'favorite_added': return <Heart className="w-4 h-4 text-red-500" />;
      case 'bookmark_created': return <Bookmark className="w-4 h-4 text-green-500" />;
      case 'search_performed': return <Search className="w-4 h-4 text-purple-500" />;
      case 'category_changed': return <BookOpen className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* En-tête avec sélecteur de période */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-arabic">
              لوحة التحكم
            </h1>
            <p className="text-gray-600 mt-1">
              Aperçu de votre activité et engagement
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Calendar className="w-5 h-5 text-gray-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Aujourd'hui</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Sessions"
            value={stats.totalSessions}
            subtitle={`Moy. ${stats.avgSessionDuration}min par session`}
            color="blue"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={BookOpen}
            title="Citations Lues"
            value={stats.quotesRead}
            subtitle={`${derivedMetrics.quotesPerSession} par session`}
            color="green"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={Heart}
            title="Favoris Ajoutés"
            value={stats.favoritesAdded}
            subtitle={`${derivedMetrics.favoriteRate}% taux de favori`}
            color="red"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={Timer}
            title="Temps de Lecture"
            value={`${stats.avgReadingTime}min`}
            subtitle="Temps moyen par citation"
            color="purple"
            isLoading={isLoading}
          />
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Search}
            title="Recherches"
            value={stats.searchQueries}
            subtitle="Requêtes effectuées"
            color="indigo"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={Bookmark}
            title="Signets"
            value={stats.totalBookmarks}
            subtitle="Pages sauvegardées"
            color="orange"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={Target}
            title="Catégorie Favorite"
            value={stats.topCategory || 'Aucune'}
            subtitle="Plus consultée"
            color="green"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={Zap}
            title="Engagement Total"
            value={derivedMetrics.totalEngagement}
            subtitle="Actions combinées"
            color="purple"
            isLoading={isLoading}
          />
        </div>

        {/* Graphiques et activité récente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CategoryChart data={categoryData} isLoading={isLoading} />
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Activité Récente
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      {activity.description}
                    </p>
                    {activity.category && (
                      <p className="text-xs text-gray-500 font-arabic mt-1">
                        {activity.category}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Métriques de Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {stats.totalSessions > 0 ? Math.round((stats.quotesRead / stats.totalSessions) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Taux de Lecture</div>
              <div className="text-xs text-gray-500 mt-1">
                Citations lues / Sessions
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {derivedMetrics.favoriteRate}%
              </div>
              <div className="text-sm text-gray-600">Taux de Favori</div>
              <div className="text-xs text-gray-500 mt-1">
                Favoris / Citations lues
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {stats.totalBookmarks}
              </div>
              <div className="text-sm text-gray-600">Signets Actifs</div>
              <div className="text-xs text-gray-500 mt-1">
                Pages sauvegardées
              </div>
            </div>
          </div>
        </div>

        {/* Message d'encouragement */}
        {stats.quotesRead > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Excellent Engagement ! 🎉
                </h3>
                <p className="text-gray-600">
                  Vous avez lu <strong>{stats.quotesRead} citations</strong> et ajouté <strong>{stats.favoritesAdded} favoris</strong>. 
                  Continuez sur cette voie spirituelle enrichissante.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;