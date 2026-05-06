'use server'

import { createCalendarEvent } from '@/lib/google-calendar';

export async function syncAppointmentToGoogleCalendar(doctorId: string, appointment: {
    summary: string,
    description?: string,
    start: string, // ISO string or date
    end: string    // ISO string or date
}) {
    try {
        await createCalendarEvent(doctorId, {
            summary: appointment.summary,
            description: appointment.description,
            start: new Date(appointment.start),
            end: new Date(appointment.end)
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error syncing to Google Calendar:', error.message);
        return { success: false, error: error.message };
    }
}
