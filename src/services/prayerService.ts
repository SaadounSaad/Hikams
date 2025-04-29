import { PrayerTime, City } from '../types';

class PrayerService {
  private static instance: PrayerService;
  private cache: Map<string, { times: PrayerTime[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes de cache

  private constructor() {}

  public static getInstance(): PrayerService {
    if (!PrayerService.instance) {
      PrayerService.instance = new PrayerService();
    }
    return PrayerService.instance;
  }

  public async getPrayerTimes(_city: City): Promise<PrayerTime[]> {
    try {
      const cached = this.cache.get('rabat');
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.times;
      }

      const times = this.getLocalPrayerTimes();
      
      this.cache.set('rabat', {
        times,
        timestamp: Date.now()
      });

      return times;
    } catch (error) {
      console.error('Erreur lors de la récupération des horaires:', error);
      return this.getLocalPrayerTimes();
    }
  }

  private getLocalPrayerTimes(): PrayerTime[] {
    const date = new Date();
    const month = date.getMonth();
    
    // Horaires officiels 2024 du ministère des Habous pour Rabat
    // Source: https://habous.gov.ma/prieres/
    const monthlyTimes = [
      ['06:44', '08:14', '13:35', '16:15', '18:55', '20:15'], // Janvier
      ['06:23', '07:51', '13:35', '16:39', '19:20', '20:35'], // Février
      ['05:51', '07:16', '13:25', '16:53', '19:45', '21:00'], // Mars
      ['05:12', '06:35', '13:12', '17:00', '20:10', '21:25'], // Avril
      ['04:40', '06:01', '13:05', '17:12', '20:33', '21:53'], // Mai
      ['04:26', '05:49', '13:08', '17:23', '20:52', '22:17'], // Juin
      ['04:36', '06:00', '13:15', '17:28', '20:55', '22:17'], // Juillet
      ['04:59', '06:22', '13:15', '17:18', '20:32', '21:49'], // Août
      ['05:23', '06:43', '13:05', '16:55', '19:55', '21:10'], // Septembre
      ['05:45', '07:03', '12:55', '16:29', '19:18', '20:33'], // Octobre
      ['06:10', '07:30', '12:52', '16:07', '18:45', '20:02'], // Novembre
      ['06:36', '07:58', '13:02', '16:03', '18:36', '19:54']  // Décembre
    ];

    const times = monthlyTimes[month];
    const prayers = ['Fajr', 'Chourouk', 'Dhohr', 'Asr', 'Maghrib', 'Ichae'];
    const icons = ['sunrise', 'sunrise', 'sun', 'sun', 'sunset', 'moon'];

    return prayers.map((name, index) => ({
      id: name.toLowerCase().replace(' ', '-'),
      name,
      time: times[index],
      icon: icons[index]
    }));
  }

  public getCities(): City[] {
    return [{ id: 'rabat', name: 'Rabat' }];
  }
}

export const prayerService = PrayerService.getInstance();