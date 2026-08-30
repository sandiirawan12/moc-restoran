import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import RestaurantGrid from '../components/RestaurantGrid';
import CountdownTimer, { formatTime, calculateRemainingSeconds } from '../components/CountdownTimer';
import HistoryTable from '../components/HistoryTable';
import QueueList from '../components/QueueList';

describe('Frontend Dashboard Unit Tests', () => {
  const sampleTables = [
    { id: 1, code: 'A', capacity: 2, status: 'available', active_session: null },
    {
      id: 2,
      code: 'B',
      capacity: 4,
      status: 'occupied',
      active_session: {
        id: 10,
        customer_name: 'Budi',
        party_size: 4,
        seated_at: new Date(Date.now() - 60000).toISOString(),
        expected_finish_at: new Date(Date.now() + 600000).toISOString(),
        color_status: 'yellow',
        remaining_seconds: 600,
      },
    },
  ];

  const sampleQueue = [
    { id: 101, customer_name: 'Big Group', party_size: 6, arrived_at: new Date().toISOString(), position: 1 },
    { id: 102, customer_name: 'Small Group', party_size: 2, arrived_at: new Date().toISOString(), position: 2 },
  ];

  // Test 1: Render Restaurant Grid and Table cards
  test('renders restaurant layout grid with tables A and B', () => {
    render(<RestaurantGrid tables={sampleTables} onForceComplete={() => {}} onDropQueueCustomer={() => {}} />);

    expect(screen.getByText('Denah Meja Restoran')).toBeInTheDocument();
    expect(screen.getByText('Meja A')).toBeInTheDocument();
    expect(screen.getByText('Meja B')).toBeInTheDocument();
    expect(screen.getByText('Budi')).toBeInTheDocument();
  });

  // Test 2: Status color badges (Tersedia for available, Terisi for occupied)
  test('displays correct status color badges on table cards', () => {
    render(<RestaurantGrid tables={sampleTables} onForceComplete={() => {}} onDropQueueCustomer={() => {}} />);

    expect(screen.getByText('Tersedia')).toBeInTheDocument();
    expect(screen.getByText('Terisi')).toBeInTheDocument();
  });

  // Test 3: Drag & Drop capacity validation callback
  test('drag and drop onto table card validates capacity rule', () => {
    const mockDropHandler = vi.fn();
    render(<RestaurantGrid tables={sampleTables} onForceComplete={() => {}} onDropQueueCustomer={mockDropHandler} />);

    const tableACard = screen.getByTestId('table-card-A');

    // Simulate drag over and drop of oversized customer (party of 6 onto Meja A capacity 2)
    const oversizedCustomer = { id: 99, customer_name: 'Huge Group', party_size: 6 };
    const dataTransfer = {
      getData: () => JSON.stringify(oversizedCustomer),
      dropEffect: 'none',
    };

    fireEvent.dragOver(tableACard, { dataTransfer });
    fireEvent.drop(tableACard, { dataTransfer });

    // Must be called with isValid = false
    expect(mockDropHandler).toHaveBeenCalledWith(oversizedCustomer, sampleTables[0], false);
  });

  // Test 4: Live Countdown Timer calculation accuracy
  test('countdown timer formatTime and calculateRemainingSeconds function accurately', () => {
    expect(formatTime(365)).toBe('06:05');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-10)).toBe('00:00');

    const futureIso = new Date(Date.now() + 120000).toISOString();
    const remaining = calculateRemainingSeconds(futureIso);
    expect(remaining).toBeGreaterThanOrEqual(118);
    expect(remaining).toBeLessThanOrEqual(120);
  });

  // Test 5: History table column header sort toggle
  test('history table column header clicks trigger sort callback with correct initial and toggle directions', () => {
    const mockSortChange = vi.fn();
    const { rerender } = render(
      <HistoryTable
        historyData={[]}
        pagination={{}}
        sortBy="completed_at"
        sortDir="desc"
        onSortChange={mockSortChange}
      />
    );

    // Initial click on customer_name should default to 'asc' for text column
    const nameHeader = screen.getByTestId('history-sort-customer_name');
    fireEvent.click(nameHeader);
    expect(mockSortChange).toHaveBeenCalledWith('customer_name', 'asc');

    // If currently sorted by customer_name (asc), clicking it again toggles to 'desc'
    rerender(
      <HistoryTable
        historyData={[]}
        pagination={{}}
        sortBy="customer_name"
        sortDir="asc"
        onSortChange={mockSortChange}
      />
    );
    fireEvent.click(nameHeader);
    expect(mockSortChange).toHaveBeenCalledWith('customer_name', 'desc');

    // Click on Meja header (table_id)
    const tableHeader = screen.getByTestId('history-sort-table_id');
    fireEvent.click(tableHeader);
    expect(mockSortChange).toHaveBeenCalledWith('table_id', 'asc');
  });

  // Test 6: Search & Status Filter triggers callbacks
  test('search input and status dropdown trigger update callbacks', () => {
    const mockSearchChange = vi.fn();
    const mockStatusChange = vi.fn();

    render(
      <HistoryTable
        historyData={[]}
        pagination={{}}
        searchValue=""
        statusFilter="all"
        onSearchChange={mockSearchChange}
        onStatusFilterChange={mockStatusChange}
      />
    );

    const searchInput = screen.getByTestId('history-search-input');
    fireEvent.change(searchInput, { target: { value: 'Budi' } });
    expect(mockSearchChange).toHaveBeenCalledWith('Budi');

    const statusSelect = screen.getByTestId('history-status-select');
    fireEvent.change(statusSelect, { target: { value: 'force_completed' } });
    expect(mockStatusChange).toHaveBeenCalledWith('force_completed');
  });
});
