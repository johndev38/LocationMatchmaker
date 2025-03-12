import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type Notification = {
  id: number;
  content: string;
  type: string;
  timestamp: string;
  relatedId?: number;
  isRead: boolean;
};

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Récupérer les notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications');
      }
      return response.json();
    },
  });

  // Marquer une notification comme lue
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la notification');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marquer toutes les notifications comme lues
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des notifications');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marquer les notifications comme lues lorsqu'on ouvre le popover
  useEffect(() => {
    if (isOpen && notifications.some(notif => !notif.isRead)) {
      markAllAsReadMutation.mutate();
    }
  }, [isOpen, notifications]);

  // Compter les notifications non lues
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.2rem] h-5 flex items-center justify-center bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{notification.content}</span>
                    <span className="text-xs text-gray-500">{formatDate(notification.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 