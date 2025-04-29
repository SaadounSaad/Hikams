import { Quote } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private notificationPermission: NotificationPermission = 'default';
  private notificationTimers: Map<string, NodeJS.Timeout> = new Map();
  private notificationTimes = ['09:00', '12:00', '15:00', '18:00', '21:00'];

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications.');
      return;
    }

    this.notificationPermission = await this.requestPermission();
    
    // Réinitialiser les notifications au changement de visibilité
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.rescheduleAllNotifications();
      }
    });
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return 'denied';
    }
  }

  public async scheduleQuoteNotification(quote: Quote) {
    if (this.notificationPermission !== 'granted') {
      console.warn('Les notifications ne sont pas autorisées');
      return;
    }

    const scheduledDate = new Date(quote.scheduledDate || '');
    if (isNaN(scheduledDate.getTime())) {
      console.error('Date de programmation invalide');
      return;
    }

    // Annuler les notifications existantes pour cette citation
    this.cancelNotification(quote.id);

    // Programmer les notifications pour chaque horaire de la journée
    this.notificationTimes.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const notificationDate = new Date(scheduledDate);
      notificationDate.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const delay = notificationDate.getTime() - now.getTime();

      if (delay > 0) {
        const timer = setTimeout(() => {
          this.showNotification(quote);
        }, delay);

        this.notificationTimers.set(`${quote.id}-${time}`, timer);
      }
    });
  }

  private showNotification(quote: Quote) {
    try {
      const notification = new Notification('Citation du jour', {
        body: `${quote.text}\n${quote.source ? `- ${quote.source}` : ''}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: quote.id,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  }

  public cancelNotification(quoteId: string) {
    // Annuler toutes les notifications programmées pour cette citation
    this.notificationTimes.forEach(time => {
      const timerId = `${quoteId}-${time}`;
      const timer = this.notificationTimers.get(timerId);
      if (timer) {
        clearTimeout(timer);
        this.notificationTimers.delete(timerId);
      }
    });
  }

  public cancelAllNotifications() {
    this.notificationTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.notificationTimers.clear();
  }

  private rescheduleAllNotifications() {
    // Cette méthode sera appelée quand l'onglet redevient visible
    this.cancelAllNotifications();
    // Les notifications seront reprogrammées lors du prochain chargement des citations
  }
}

export const notificationService = NotificationService.getInstance();