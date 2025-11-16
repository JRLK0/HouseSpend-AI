'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { TicketUpload } from '@/components/Tickets/TicketUpload';

export default function UploadTicketPage() {
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Subir Ticket</h1>
        <TicketUpload />
      </div>
    </MainLayout>
  );
}

