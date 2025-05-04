'use client';
import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

export default function Clarity() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      clarity.init('regjnz11le');
    }
  }, []);
  
  return null;
}