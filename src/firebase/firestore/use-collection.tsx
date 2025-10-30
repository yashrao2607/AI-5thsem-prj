'use client';
import {
  collection,
  onSnapshot,
  query,
  Query,
  DocumentData,
  FirestoreError,
  orderBy,
  where,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
} from 'firebase/firestore';
import React, {useEffect, useState} from 'react';

export interface UseCollectionOptions {
  orderBy?: string | [string, 'asc' | 'desc'];
  where?: [string, any, any];
  limit?: number;
  startAt?: any;
  startAfter?: any;
  endAt?: any;
  endBefore?: any;
}

export const useCollection = <T extends DocumentData>(
  collectionRef: Query<T> | null,
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!collectionRef) {
        setLoading(false);
        return;
    }
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        setData(
          snapshot.docs.map((doc) => ({...(doc.data() as T), id: doc.id}))
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionRef]);

  return {data, loading, error};
};
