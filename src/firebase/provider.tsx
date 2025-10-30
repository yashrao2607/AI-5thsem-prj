'use client';
import {FirebaseApp} from 'firebase/app';
import {Auth} from 'firebase/auth';
import {Firestore} from 'firebase/firestore';
import React, {createContext, useContext} from 'react';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseProviderProps | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  return (
    <FirebaseContext.Provider value={{firebaseApp, firestore, auth}}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseProviderProps => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useFirebase().firebaseApp;
};

export const useFirestore = (): Firestore => {
  return useFirebase().firestore;
};

export const useAuth = (): Auth => {
  return useFirebase().auth;
};
