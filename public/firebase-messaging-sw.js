importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBZDyo1uyVP2S9BZFu8t12roH3iPdU-TZY",
  authDomain: "bge-progress.firebaseapp.com",
  projectId: "bge-progress",
  storageBucket: "bge-progress.firebasestorage.app",
  messagingSenderId: "29876816244",
  appId: "1:29876816244:web:827e8bf74e8bb977830421",
  measurementId: "G-6P9FMZ4KR9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'BGE Progress';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.tag || 'bge_push',
    data: { url: payload.data?.url || '/' }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
