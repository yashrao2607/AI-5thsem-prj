'use client';
import {
  onSnapshot,
  doc,
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import React, {useEffect, useState} from 'react';

export const useDoc = <T extends DocumentData>(
  docRef: DocumentReference<T> | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!docRef) {
        setLoading(false);
        return;
    }
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({...(snapshot.data() as T), id: snapshot.id});
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return {data, loading, error};
};
