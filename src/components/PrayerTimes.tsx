import React, { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, X } from 'lucide-react';
import { PrayerTime, City } from '../types';
import { prayerService } from '../services/prayerService';

interface PrayerTimesProps {
  onClose: () => void;
}

export const PrayerTimes: React.FC<PrayerTimesProps> = ({ onClose }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const city = { id: 'rabat', name: 'Rabat' };

  // Utilisation d'un useEffect avec un intervalle pour mettre à jour les horaires
  useEffect(() => {
    let mounted = true;

    const fetchPrayerTimes = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);
        const times = await prayerService.getPrayerTimes(city);
        
        if (mounted) {
          setPrayerTimes(times);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue');
          setLoading(false);
        }
      }
    };

    fetchPrayerTimes();

    // Mettre à jour toutes les minutes
    const interval = setInterval(fetchPrayerTimes, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getNextPrayer = (): PrayerTime | null => {
    if (!prayerTimes.length) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const prayer of prayerTimes) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      if (prayerTime > currentTime) {
        return prayer;
      }
    }

    return prayerTimes[0];
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Horaires des prières</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <span className="sr-only">Fermer</span>
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">{city.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des horaires...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <AlertCircle className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          {nextPrayer && (
            <div className="mb-6 p-4 bg-sky-50 rounded-xl">
              <h3 className="text-sm font-medium text-sky-900 mb-2">Prochaine prière</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sky-600" />
                  <span className="font-medium text-sky-900">{nextPrayer.name}</span>
                </div>
                <span className="text-lg font-semibold text-sky-600">{nextPrayer.time}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {prayerTimes.map((prayer) => (
              <div
                key={prayer.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  prayer.id === nextPrayer?.id
                    ? 'bg-sky-50 ring-1 ring-sky-100'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${
                    prayer.id === nextPrayer?.id ? 'text-sky-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium">{prayer.name}</span>
                </div>
                <span className={`text-lg font-semibold ${
                  prayer.id === nextPrayer?.id ? 'text-sky-600' : 'text-gray-600'
                }`}>{prayer.time}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};