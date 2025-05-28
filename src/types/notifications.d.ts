// 1. src/types/notifications.d.ts - Étendre NotificationOptions
declare global {
  interface NotificationOptions {
    vibrate?: number[] | number;
    actions?: NotificationAction[];
    data?: any;
  }
}
export {};