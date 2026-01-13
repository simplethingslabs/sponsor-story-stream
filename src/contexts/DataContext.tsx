import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Child, ProgressReport, Newsletter, SchoolEvent, Sponsorship } from '@/types';
import {
  mockChildren,
  mockProgressReports,
  mockNewsletters,
  mockEvents,
  mockSponsorships,
  mockReportMedia,
  mockEventMedia,
} from '@/data/mockData';

interface DataContextType {
  // Children
  children: Child[];
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  deleteChild: (id: string) => void;
  getChildById: (id: string) => Child | undefined;

  // Reports
  reports: ProgressReport[];
  addReport: (report: Omit<ProgressReport, 'id' | 'created_at' | 'updated_at'>) => void;
  updateReport: (id: string, updates: Partial<ProgressReport>) => void;
  deleteReport: (id: string) => void;
  getReportsForChild: (childId: string) => ProgressReport[];
  getReportMedia: (reportId: string) => typeof mockReportMedia;

  // Newsletters
  newsletters: Newsletter[];
  addNewsletter: (newsletter: Omit<Newsletter, 'id' | 'created_at'>) => void;
  deleteNewsletter: (id: string) => void;

  // Events
  events: SchoolEvent[];
  addEvent: (event: Omit<SchoolEvent, 'id' | 'created_at'>) => void;
  updateEvent: (id: string, updates: Partial<SchoolEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventMedia: (eventId: string) => typeof mockEventMedia;

  // Sponsorships
  sponsorships: Sponsorship[];
  getChildrenForSponsor: (sponsorId: string) => Child[];
  assignSponsor: (sponsorId: string, childId: string) => void;
  removeSponsor: (sponsorId: string, childId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children: childrenProp }: { children: React.ReactNode }) {
  const [childrenData, setChildrenData] = useState<Child[]>(mockChildren);
  const [reports, setReports] = useState<ProgressReport[]>(mockProgressReports);
  const [newsletters, setNewsletters] = useState<Newsletter[]>(mockNewsletters);
  const [events, setEvents] = useState<SchoolEvent[]>(mockEvents);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>(mockSponsorships);

  // Children CRUD
  const addChild = useCallback((child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
    const newChild: Child = {
      ...child,
      id: `child-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setChildrenData(prev => [...prev, newChild]);
  }, []);

  const updateChild = useCallback((id: string, updates: Partial<Child>) => {
    setChildrenData(prev =>
      prev.map(c =>
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteChild = useCallback((id: string) => {
    setChildrenData(prev => prev.filter(c => c.id !== id));
  }, []);

  const getChildById = useCallback((id: string) => {
    return childrenData.find(c => c.id === id);
  }, [childrenData]);

  // Reports CRUD
  const addReport = useCallback((report: Omit<ProgressReport, 'id' | 'created_at' | 'updated_at'>) => {
    const newReport: ProgressReport = {
      ...report,
      id: `report-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReports(prev => [...prev, newReport]);
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<ProgressReport>) => {
    setReports(prev =>
      prev.map(r =>
        r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
      )
    );
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  const getReportsForChild = useCallback((childId: string) => {
    return reports
      .filter(r => r.child_id === childId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const quarterOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
        return quarterOrder[b.quarter] - quarterOrder[a.quarter];
      });
  }, [reports]);

  const getReportMedia = useCallback((reportId: string) => {
    return mockReportMedia.filter(m => m.report_id === reportId).sort((a, b) => a.order - b.order);
  }, []);

  // Newsletters CRUD
  const addNewsletter = useCallback((newsletter: Omit<Newsletter, 'id' | 'created_at'>) => {
    const newNewsletter: Newsletter = {
      ...newsletter,
      id: `news-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setNewsletters(prev => [newNewsletter, ...prev]);
  }, []);

  const deleteNewsletter = useCallback((id: string) => {
    setNewsletters(prev => prev.filter(n => n.id !== id));
  }, []);

  // Events CRUD
  const addEvent = useCallback((event: Omit<SchoolEvent, 'id' | 'created_at'>) => {
    const newEvent: SchoolEvent = {
      ...event,
      id: `event-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setEvents(prev => [newEvent, ...prev]);
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<SchoolEvent>) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEventMedia = useCallback((eventId: string) => {
    return mockEventMedia.filter(m => m.event_id === eventId).sort((a, b) => a.order - b.order);
  }, []);

  // Sponsorships
  const getChildrenForSponsor = useCallback((sponsorId: string) => {
    const sponsoredChildIds = sponsorships
      .filter(s => s.sponsor_id === sponsorId && s.status === 'active')
      .map(s => s.child_id);
    return childrenData.filter(c => sponsoredChildIds.includes(c.id));
  }, [sponsorships, childrenData]);

  const assignSponsor = useCallback((sponsorId: string, childId: string) => {
    const existing = sponsorships.find(
      s => s.sponsor_id === sponsorId && s.child_id === childId
    );
    if (!existing) {
      const newSponsorship: Sponsorship = {
        id: `sp-${Date.now()}`,
        sponsor_id: sponsorId,
        child_id: childId,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setSponsorships(prev => [...prev, newSponsorship]);
    }
  }, [sponsorships]);

  const removeSponsor = useCallback((sponsorId: string, childId: string) => {
    setSponsorships(prev =>
      prev.map(s =>
        s.sponsor_id === sponsorId && s.child_id === childId
          ? { ...s, status: 'ended' as const, end_date: new Date().toISOString().split('T')[0] }
          : s
      )
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        children: childrenData,
        addChild,
        updateChild,
        deleteChild,
        getChildById,
        reports,
        addReport,
        updateReport,
        deleteReport,
        getReportsForChild,
        getReportMedia,
        newsletters,
        addNewsletter,
        deleteNewsletter,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventMedia,
        sponsorships,
        getChildrenForSponsor,
        assignSponsor,
        removeSponsor,
      }}
    >
      {childrenProp}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
