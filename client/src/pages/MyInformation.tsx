import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Header from './header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

interface FormData {
  name: string;
  email: string;
  address: string;
  phone: string;
}

// Types pour les données de l'API
interface UserInfo {
  username: string;
  email: string;
  address: string;
  phone: string;
  isLandlord: boolean;
}

export default function MyInformation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: user?.username || '',
      email: '',
      address: '',
      phone: '',
    }
  });

  // Utilisation correcte de useQuery avec gestion du succès via le hook
  const { data } = useQuery<UserInfo, Error, UserInfo, [string]>({
    queryKey: ['/api/user-info'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-info');
      return res.json();
    }
  });

  // Effet pour mettre à jour les champs du formulaire quand les données sont chargées
  useEffect(() => {
    if (data) {
      setValue('name', data.username);
      setValue('email', data.email);
      setValue('address', data.address || '');
      setValue('phone', data.phone || '');
    }
  }, [data, setValue]);

  const updateUserInfo = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/user-info', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-info'] });
    }
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    updateUserInfo.mutate(data);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-20">
        <h2 className="text-2xl font-bold mb-4">Mes informations</h2>
        {/* Case non éditable pour le statut propriétaire/non-propriétaire */}
        {data && (
          <div className="mb-6 p-4 bg-gray-100 rounded-md">
            <p className="text-sm font-medium text-gray-700">Statut du compte</p>
            <p className="font-semibold">
      
              {data.isLandlord ? 'Propriétaire' : 'Locataire'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.isLandlord 
                ? 'Vous pouvez proposer des offres de location.'
                : 'Vous pouvez créer des demandes de location.'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email', { required: "L'email est requis" })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input
              {...register('address', { required: "L'adresse est requise" })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
            {errors.address && <span className="text-red-500 text-sm">{errors.address.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
            <input
              type="tel"
              {...register('phone', { required: 'Le numéro de téléphone est requis' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
            {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
          </div>
          <Button type="submit" variant="default">Mettre à jour</Button>
        </form>
      </div>
    </>
  );
}
