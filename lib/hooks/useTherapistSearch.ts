import { useState, useEffect } from 'react';
import { createValidatedPayload, searchTherapists } from '../utils/payload';
import type { SearchResult, PayloadValidation } from '../types/payload';

export function useTherapistSearch() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<PayloadValidation | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { payload, isValid, errors, warnings } = createValidatedPayload();
        
        setValidation({ isValid, errors, warnings });
        
        if (!isValid) {
          setError(`Validation failed: ${errors.join(", ")}`);
          setLoading(false);
          return;
        }

        // Show warnings in console
        if (warnings.length > 0) {
          console.warn("Search warnings:", warnings);
        }

        const data = await searchTherapists(payload);
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, []);

  const retry = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const { payload, isValid, errors, warnings } = createValidatedPayload();
      
      if (!isValid) {
        setError(`Validation failed: ${errors.join(", ")}`);
        setLoading(false);
        return;
      }

      const data = await searchTherapists(payload);
      setResults(data);
    } catch (err) {
      console.error('Retry failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { 
    results, 
    loading, 
    error, 
    validation, 
    retry 
  };
}
