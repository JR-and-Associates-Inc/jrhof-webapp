'use client';
import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

interface ClarityProps {
  consentGiven: boolean;
}

export default function Clarity({ consentGiven }: ClarityProps) {
  useEffect(() => {
    if (!consentGiven || process.env.NODE_ENV !== 'production') return;

    clarity.init('regjnz11le');
  }, [consentGiven]);

  return null;
}