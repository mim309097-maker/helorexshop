
/**
 * Simple Web Push Notification utility
 * This will trigger native browser notifications on both Desktop and Mobile (Android Chrome/iOS Safari)
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const triggerPushNotification = async (title: string, options: NotificationOptions = {}) => {
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.showNotification(title, {
        icon: '/logo.png', // Replace with your logo path
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        ...options
      } as any);
    } else {
      new Notification(title, options);
    }
    return true;
  }
  return false;
};
