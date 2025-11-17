// Fix: Import React to provide the 'React' namespace for types.
import React, { useState, useEffect, useRef } from 'react';

function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved) as T;
      } catch (e) {
        console.error('Failed to parse localStorage item', e);
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

export function useLocalStorage<T>(
    key: string, 
    defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, 'saving' | 'saved'] {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });
  const [status, setStatus] = useState<'saving' | 'saved'>('saved');
  
  // Use a ref to hold the latest value for the unload handler
  const valueRef = useRef(value);
  valueRef.current = value;

  const firstRender = useRef(true);

  // Debounced save for during the session
  useEffect(() => {
    // Skip the effect on the first render to avoid a "saving" flash on load
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setStatus('saving');

    const handler = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setStatus('saved');
      } catch (error) {
        console.error(`Failed to save to localStorage with key "${key}":`, error);
        // In a real app, you might want a 'failed' state
      }
    }, 1500); // Wait 1.5s after the user stops typing to save

    return () => {
      clearTimeout(handler);
    };
  }, [key, value]);

  // Save on unload to prevent data loss if the app is closed before the debounce finishes
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Use the ref to get the latest value without causing re-renders
        localStorage.setItem(key, JSON.stringify(valueRef.current));
      } catch (error) {
        console.error(`Failed to save to localStorage on unload with key "${key}":`, error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key]); // Only depends on key

  return [value, setValue, status];
}
