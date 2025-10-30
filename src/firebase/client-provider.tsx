'use client';
import {FirebaseApp, initializeApp} from 'firebase/app';
import {Auth, getAuth} from 'firebase/auth';
import {Firestore, getFirestore} from 'firebase/firestore';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {FirebaseProvider, FirebaseProviderProps} from './provider';
import {UserProvider} from './auth/use-user';
import {firebaseConfig} from './config';

export interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({
  children,
}) => {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const authInstance = getAuth(app);

    setFirebaseApp(app);
    setFirestore(db);
    setAuth(authInstance);
  }, []);

  if (!firebaseApp || !firestore || !auth) {
    return null; // or a loading spinner
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      <UserProvider>{children}</UserProvider>
    </FirebaseProvider>
  );
};
