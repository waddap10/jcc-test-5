import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { addMonths, format, subMonths } from 'date-fns';
import React, { useState } from 'react';
import { route } from 'ziggy-js';

interface Venue {
  id: number;
  name: string;
  short: string;
}

interface Slot {
  order_id: number;
  schedule_id?: number;
  event_name: string;
  function?: string;
  display_text?: string;
  start: string;
  end: string;
  is_single_day?: boolean;
  date_range?: string;
  date_span?: string[];
  status: number;
  setup?: string;
}

interface VenueSchedule {
  name: string;
  slots: Slot[];
}

interface Props {
  venues: Venue[];
  calendarData: Record<number, VenueSchedule>;
  month: number;
  year: number;
  filters?: {
    date: string | null;
    venue: number | null;
    status: number | null;
  };
  statusOptions?: Array<{ value: number; label: string }>;
}

const STATUS_CONFIG = {
  0: { label: 'New Inquiry', bgClass: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-200', bgcolor: '#A5D6A7' },
  1: { label: 'Sudah Konfirmasi', bgClass: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-200', bgcolor: '#FFF59D' },
  2: { label: 'Sudah dilaksanakan', bgClass: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-200', bgcolor: '#90CAF9' },
} as const;

const DEFAULT_STATUS_OPTIONS = [
  { value: 0, label: 'New Inquiry' },
  { value: 1, label: 'Sudah Konfirmasi' },
  { value: 2, label: 'Sudah dilaksanakan' },
];

export default function Calendar({ venues, calendarData, month, year, filters, statusOptions }: Props) {
  const safeFilters = {
    date: filters?.date || null,
    venue: filters?.venue || null,
    status: filters?.status !== undefined ? filters.status : null,
  };
  
  const [filterDate, setFilterDate] = useState(safeFilters.date || '');
  const [filterVenue, setFilterVenue] = useState(safeFilters.venue || '');
  const [filterStatus, setFilterStatus] = useState(safeFilters.status !== null ? safeFilters.status?.toString() || '' : '');
  
  const current = new Date(year, month - 1, 1);
  const prev = subMonths(current, 1);
  const next = addMonths(current, 1);
  const statusOpts = statusOptions?.length ? statusOptions : DEFAULT_STATUS_OPTIONS;

  const getFunctionByPosition = (slot: Slot, currentDate: string): string => {
    if (slot.function) {
      return getFunctionName(slot.function);
    }
    
    const startDate = slot.start.slice(0, 10);
    const endDate = slot.end.slice(0, 10);
    const isSingleDay = startDate === endDate;
    
    if (isSingleDay) return 'Show';
    if (currentDate === startDate) return 'Loading In';
    if (currentDate === endDate) return 'Loading Out';
    return 'Show';
  };

  const getFunctionName = (functionValue: string) => {
    const functions = { '1': 'Loading In', '2': 'Show', '3': 'Loading Out' };
    return functions[functionValue] || functionValue;
  };

  const getStatusInfo = (status: number) => {
    return STATUS_CONFIG[status] || { 
      label: 'Unknown', 
      bgcolor: '#E0E0E0', 
      bgClass: 'bg-gray-100',
      textColor: 'text-gray-800', 
      borderColor: 'border-gray-200' 
    };
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const allRows = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    // Force UTC to avoid timezone issues
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return { dateObj: d, iso };
  });

  // Filter venues based on venue filter
  const filteredVenues = filterVenue ? venues.filter(v => v.id.toString() === filterVenue.toString()) : venues;
  
  // Filter dates based on date filter - simple string comparison
  const filteredRows = filterDate ? allRows.filter(row => row.iso === filterDate) : allRows;

  const applyFilters = () => {
    const params = { month: month.toString(), year: year.toString() };
    
    if (filterDate) params.filter_date = filterDate;
    if (filterVenue) params.filter_venue = filterVenue.toString();
    if (filterStatus !== '') params.filter_status = filterStatus;
    
    router.get(route('calendars.index'), params, {
      preserveState: false,
      preserveScroll: true
    });
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterVenue('');
    setFilterStatus('');
    router.get(route('calendars.index'), { month, year }, {
      preserveState: false,
      preserveScroll: true
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    router.visit(route('calendars.index', {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    }));
  };

  const hasActiveFilters = filterDate || filterVenue || filterStatus !== '';

  return (
    <AppLayout breadcrumbs={[{ title: 'Calendar', href: '/orders/calendar' }]}>
      <Head title="Venue Booking Calendar" />

      <div className="px-4 py-6 space-y-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={route('calendars.index', {
              month: prev.getMonth() + 1,
              year: prev.getFullYear(),
            })}
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-white font-medium transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: '#C38154' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B5734A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C38154';
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{format(prev, 'MMM yyyy')}</span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {format(current, 'MMMM yyyy')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Calendar View</p>
          </div>

          <Link
            href={route('calendars.index', {
              month: next.getMonth() + 1,
              year: next.getFullYear(),
            })}
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-white font-medium transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: '#C38154' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B5734A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C38154';
            }}
          >
            <span>{format(next, 'MMM yyyy')}</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Filters */}
        <div 
          className="rounded-lg border p-6"
          style={{ backgroundColor: '#C38154', borderColor: '#B5734A' }}
        >
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Filter Calendar</h3>
          </div>
          
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label htmlFor="filter-date" className="text-sm font-medium text-white whitespace-nowrap">
                Show only date:
              </label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40 bg-white border-white/30 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="filter-venue" className="text-sm font-medium text-white whitespace-nowrap">
                Show only venue:
              </label>
              <select
                id="filter-venue"
                value={filterVenue}
                onChange={(e) => setFilterVenue(e.target.value)}
                className="w-44 px-3 py-2 border border-white/30 rounded-md text-sm focus:ring-2 focus:ring-white/30 focus:border-white bg-white text-gray-900"
              >
                <option value="">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="filter-status" className="text-sm font-medium text-white whitespace-nowrap">
                Status:
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-44 px-3 py-2 border border-white/30 rounded-md text-sm focus:ring-2 focus:ring-white/30 focus:border-white bg-white text-gray-900"
              >
                <option value="">All Statuses</option>
                {statusOpts.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-transparent border border-white text-white rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-200"
              >
                Clear
              </button>
              <button
                onClick={handleTodayClick}
                className="px-4 py-2 bg-transparent border border-white text-white rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-200"
              >
                Today
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-3 text-sm mt-4 pt-4 border-t border-white/20">
              <span className="font-medium text-white">Active filters:</span>
              <div className="flex gap-2 flex-wrap">
                {filterDate && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    Date: {filterDate}
                  </span>
                )}
                {filterVenue && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    Venue: {venues.find(v => v.id.toString() === filterVenue.toString())?.name}
                  </span>
                )}
                {filterStatus !== '' && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    Status: {statusOpts.find(s => s.value.toString() === filterStatus)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Availability table */}
        <div className="w-full h-96 overflow-auto border border-gray-200 rounded-lg">
          <table className="min-w-full table-fixed border-collapse">
            <caption className="caption-bottom py-2 text-sm text-gray-500">
              Availability for {format(current, 'MMMM yyyy')}
            </caption>

            <thead className="sticky top-0 z-20 bg-white border-b-2 border-gray-300">
              <tr>
                <th className="sticky left-0 z-30 w-20 min-w-20 bg-white border-r-2 border-gray-300 font-semibold text-center text-sm p-3 border-b border-gray-200">
                  Date
                </th>
                {filteredVenues.map(v => (
                  <th key={v.id} className="w-32 min-w-32 bg-white text-center font-semibold text-sm p-3 border-b border-gray-200 border-r border-gray-200">
                    <div className="truncate" title={v.name}>
                      {v.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map(({ dateObj, iso }, rowIndex) => (
                <tr key={iso} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <td className="sticky left-0 z-10 w-20 min-w-20 bg-inherit border-r-2 border-gray-300 font-medium text-center py-3 px-2">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{format(dateObj, 'd')}</span>
                      <span className="text-xs text-gray-500">{format(dateObj, 'EEE')}</span>
                    </div>
                  </td>

                  {(() => {
                    const cells: React.ReactNode[] = [];
                    let i = 0;

                    const scheduleMap = filteredVenues.reduce<Record<number, Slot[]>>((acc, venue) => {
                      acc[venue.id] = calendarData[venue.id]?.slots.filter((slot) => {
                        // Apply status filter to slot data
                        if (filterStatus !== '' && slot.status.toString() !== filterStatus) {
                          return false;
                        }
                        
                        if (slot.date_span && Array.isArray(slot.date_span)) {
                          return slot.date_span.includes(iso);
                        } else {
                          const startDate = slot.start.slice(0, 10);
                          const endDate = slot.end.slice(0, 10);
                          return startDate <= iso && iso <= endDate;
                        }
                      }) ?? [];
                      return acc;
                    }, {});

                    while (i < filteredVenues.length) {
                      const venueId = filteredVenues[i].id;
                      const slots = scheduleMap[venueId];

                      if (!slots.length) {
                        cells.push(
                          <td key={`${venueId}-empty`} className="w-32 min-w-32 text-center py-3 px-2 text-gray-400 text-xs border-r border-gray-200"></td>
                        );
                        i++;
                        continue;
                      }

                      const scheduleId = slots[0].schedule_id || slots[0].order_id;
                      let span = 1;
                      while (
                        i + span < filteredVenues.length &&
                        scheduleMap[filteredVenues[i + span].id].some((s) => 
                          (s.schedule_id || s.order_id) === scheduleId
                        )
                      ) {
                        span++;
                      }

                      const statusInfo = getStatusInfo(slots[0].status);
                      const displayText = slots[0].event_name || `Order #${slots[0].order_id}`;
                      const functionName = getFunctionByPosition(slots[0], iso);

                      cells.push(
                        <td 
                          key={`${venueId}-${scheduleId}`} 
                          colSpan={span} 
                          className={`w-32 min-w-32 p-2 text-center ${statusInfo.bgClass} text-xs border-r border-gray-200`}
                        >
                          <div className="break-words leading-tight">
                            {`${displayText}: ${functionName}`}
                          </div>
                        </td>
                      );

                      i += span;
                    }

                    return cells;
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Scroll indicators */}
        <div className="bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg px-4 py-2 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>← Scroll horizontally to view all venues →</span>
              <span>↑ Scroll vertically to view all dates ↓</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}</span>
              <span>{filteredRows.length} day{filteredRows.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}