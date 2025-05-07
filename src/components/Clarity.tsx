'use client';
import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

export default function Clarity({ consentGiven }: { consentGiven: boolean }) {
  useEffect(() => {
    if (consentGiven && process.env.NODE_ENV === 'production') {
      clarity.init('regjnz11le');
    }
  }, [consentGiven]);

  return null;
}