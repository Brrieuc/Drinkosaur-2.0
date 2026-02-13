/// <reference path="../firebase.d.ts" />

import { useState, useEffect, useCallback } from 'react';
import { FriendGroup } from '../types';

export interface AwardNotification {
    id: string;           // e.g. "awards-groupId-2026-1" (unique per group/month)
    groupId: string;
    groupName: string;
    groupIcon?: string;
    month: number;        // 0-indexed
    year: number;
    isRead: boolean;
    createdAt: number;    // timestamp
}

const STORAGE_KEY = 'drinkosaur_award_notifications_read';

/** Get the set of read notification IDs from localStorage */
const getReadIds = (): Set<string> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw));
    } catch {
        return new Set();
    }
};

/** Save read notification IDs */
const saveReadIds = (ids: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

/**
 * Generates award notifications for all groups the user belongs to.
 * A notification is created for the previous month (relative to today).
 * The notification is "unread" until the user marks it as read.
 */
export const useAwardNotifications = (groups: FriendGroup[]) => {
    const [notifications, setNotifications] = useState<AwardNotification[]>([]);

    // Generate notifications based on groups and current date
    useEffect(() => {
        if (groups.length === 0) {
            setNotifications([]);
            return;
        }

        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        const readIds = getReadIds();

        const notifs: AwardNotification[] = groups.map(group => {
            const id = `awards-${group.id}-${prevYear}-${prevMonth}`;
            return {
                id,
                groupId: group.id,
                groupName: group.name,
                groupIcon: group.icon,
                month: prevMonth,
                year: prevYear,
                isRead: readIds.has(id),
                createdAt: new Date(prevYear, prevMonth + 1, 1).getTime(), // 1st of the next month
            };
        });

        // Sort unread first, then by date descending
        notifs.sort((a, b) => {
            if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
            return b.createdAt - a.createdAt;
        });

        setNotifications(notifs);
    }, [groups]);

    const markAsRead = useCallback((notificationId: string) => {
        const readIds = getReadIds();
        readIds.add(notificationId);
        saveReadIds(readIds);

        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        );
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        awardNotifications: notifications,
        markAwardAsRead: markAsRead,
        unreadAwardCount: unreadCount,
    };
};
