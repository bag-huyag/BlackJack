import { useEffect, useState } from "react";

export function useLocalStorageString(
  key: string,
  initialValue: any = null
): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? storedValue : initialValue;
  });

  useEffect(() => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, value);
    }
  }, [key, value]);

  return [value, setValue];
}

export function useLocalStorageObject<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
