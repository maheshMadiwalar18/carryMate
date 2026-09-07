import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { config } from './config';

function getFirebaseApp() {
  if (getApps().length) return getApp();
  return initializeApp(config.firebase);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
