import { useState, useEffect } from 'react';

const useIndexedDB = (dbName: string, storeName: string) => {
  const [db, setDB] = useState(null);

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event) => {
        setDB(event?.target?.result);
      };

      request.onerror = (event) => {
        console.error('Error opening IndexedDB', event.target.error);
      };
    };

    openDB();
  }, [dbName, storeName]);

  const removeFromDb = (id) => {
    if (!db) return;

    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.delete(id);

    request.onerror = (event) => {
      console.error('Error deleting from IndexedDB', event.target.error);
    };
  };

  const addToDB = ({ name, data }: { name: string; data: Blob }) => {
    if (!db) return;

    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.add({ name, data });

    request.onerror = (event) => {
      console.error('Error adding to IndexedDB', event.target.error);
    };
  };

  const getAllFromDB = (callback) => {
    if (!db) return;

    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      callback(request.result);
    };

    request.onerror = (event) => {
      console.error('Error getting all from IndexedDB', event.target.error);
    };
  };

  return {
    addToDB,
    getAllFromDB,
    removeFromDb,
  };
};

export default useIndexedDB;
