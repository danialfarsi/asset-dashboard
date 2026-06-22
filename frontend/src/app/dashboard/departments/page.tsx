'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: number;
  name: string;
  code: string;
  organization: {
    id: number;
    name: string;
    code: string;
  };
}

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/accounts/departments/');
      setDepartments(data.results || data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">واحدهای سازمانی</h1>
          <p className="text-sm text-gray-500">
            {user?.organization_name || 'سازمان شما'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Link href={`/dashboard/departments/${dept.code}`} key={dept.id}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-sm text-gray-500">کد: {dept.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>هیچ واحدی تعریف نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}
