// src/services/notificationService.ts

import { storage } from '../utils/storage';
import { Quote } from '../types';

// Interface pour les notifications
export interface Notification {
  title: string;
  body: string;
  data?: any;
}

export const notificationService = {
  // Stockage des abonnements push
  subscriptions: new Set<PushSubscription>(),

  // Vérifier si les notifications sont supportées
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Demander la permission pour les notifications
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Les notifications ne sont pas supportées sur ce navigateur');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  },

  // Afficher une notification
  async showNotification(notification: Notification): Promise<void> {
    // Vérifier si les notifications sont activées
    if (Notification.permission !== 'granted') {
      console.warn('Permission de notification non accordée');
      return;
    }

    // Afficher la notification
    try {
      const { title, body, data } = notification;
      
      // Si le service worker est enregistré, utiliser les notifications push
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          vibrate: [200, 100, 200],
          data,
          actions: data?.type === 'note_reminder' ? [
            { action: 'view', title: 'Voir' },
            { action: 'complete', title: 'Terminé' }
          ] : undefined
        });
      } else {
        // Fallback vers les notifications simples
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  },

  // Programmer une notification pour une citation
  async scheduleQuoteNotification(quote: Quote): Promise<void> {
    // Si la citation a une date de programmation dans le futur
    if (quote.scheduledDate) {
      const scheduledDate = new Date(quote.scheduledDate);
      const now = new Date();
      
      // Vérifier si la date est dans le futur
      if (scheduledDate > now) {
        // Stocker la citation programmée
        // (Cette partie dépend de votre implémentation pour gérer les citations programmées)
        console.log(`Citation programmée pour le ${scheduledDate.toLocaleString()}`, quote);
      }
    }
  },

  // Vérifier les rappels de notes dus aujourd'hui
  async checkNoteReminders(): Promise<void> {
    try {
      const dueReminders = await storage.getDueNoteReminders();
      
      if (dueReminders.length === 0) return;
      
      dueReminders.forEach(reminder => {
        const quoteText = reminder.quote?.text || '';
        const quotePreview = quoteText.length > 50 ? quoteText.substring(0, 50) + '...' : quoteText;
        
        this.showNotification({
          title: 'Rappel d\'action',
          body: `${reminder.content}\n\nCitation: "${quotePreview}"`,
          data: {
            type: 'note_reminder',
            noteId: reminder.id,
            quoteId: reminder.quote_id
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des rappels de notes:', error);
    }
  },

  // Gérer les actions de notification
  async handleNotificationAction(action: string, data: any): Promise<void> {
    if (data?.type === 'note_reminder') {
      if (action === 'complete') {
        // Marquer la note comme complétée
        try {
          await storage.updateQuoteNote(data.noteId, {
            completed: true
          });
          console.log('Note marquée comme terminée:', data.noteId);
        } catch (error) {
          console.error('Erreur lors de la complétion de la note:', error);
        }
      } else if (action === 'view') {
        // Rediriger vers la citation
        if (data.quoteId) {
          window.location.href = `/quote/${data.quoteId}`;
        }
      }
    }
  },

  // Initialiser le service de notification
  async init(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Les notifications ne sont pas supportées sur ce navigateur');
      return;
    }

    try {
      // Vérifier si la permission est déjà accordée
      if (Notification.permission === 'granted') {
        // Récupérer le service worker
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          // Configurer le gestionnaire d'événements pour les clics sur les notifications
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
              this.handleNotificationAction(event.data.action, event.data.notification.data);
            }
          });
          
          // Vérifier les rappels de notes au démarrage
          this.checkNoteReminders();
          
          // Vérifier périodiquement les rappels (toutes les heures)
          setInterval(() => this.checkNoteReminders(), 60 * 60 * 1000);
          
          console.log('Service de notification initialisé avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de notification:', error);
    }
  }
};