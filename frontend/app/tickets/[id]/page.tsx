'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { TicketDetail } from '@/components/Tickets/TicketDetail';

export default function TicketDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <MainLayout>
      <TicketDetail />
    </MainLayout>
  );
}

