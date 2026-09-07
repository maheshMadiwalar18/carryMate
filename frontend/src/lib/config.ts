export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',

  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },

  mapbox: {
    token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  },
  googleMaps: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },

  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
};

/** True when Firebase Authentication is fully configured on the client. */
export const isFirebaseConfigured = Boolean(
  config.firebase.apiKey && config.firebase.projectId && config.firebase.appId
);

export const isMapsConfigured = Boolean(config.mapbox.token || config.googleMaps.apiKey);
