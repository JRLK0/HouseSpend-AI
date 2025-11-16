'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { UserList } from '@/components/Users/UserList';

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <UserList />
    </MainLayout>
  );
}

