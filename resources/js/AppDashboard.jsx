import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import RestaurantGrid from './components/RestaurantGrid';
import QueueList from './components/QueueList';
import HistoryTable from './components/HistoryTable';
import ArrivalModal from './components/ArrivalModal';
import RevenueModal from './components/RevenueModal';
import NotificationModal from './components/NotificationModal';

const DEFAULT_TABLES = [
  { id: 1, code: 'A', capacity: 2, status: 'available' },
  { id: 2, code: 'B', capacity: 4, status: 'available' },
  { id: 3, code: 'C', capacity: 6, status: 'available' },
  { id: 4, code: 'D', capacity: 8, status: 'available' },
];

export default function AppDashboard() {
  const [tables, setTables] = useState(DEFAULT_TABLES);
  const [queue, setQueue] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({});
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('');
  const [sortBy, setSortBy] = useState('completed_at');
  const [sortDir, setSortDir] = useState('desc');
  const [historyPage, setHistoryPage] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Modals state
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Popup Notification Modal state
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info', title = null) => {
    setNotification({ message, type, title });
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch real-time status (tables & queue)
  const fetchStatus = useCallback(async (isManual = false, forceRefresh = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      const url = `${API_BASE_URL}/api/status${forceRefresh ? '?refresh=1' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil status restoran');
      const data = await res.json();
      if (Array.isArray(data.tables) && data.tables.length > 0) {
        setTables(data.tables);
      }
      if (Array.isArray(data.queue)) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [API_BASE_URL]);

  // Fetch history list
  const fetchHistory = useCallback(async (isCancelled = () => false, forceRefresh = false) => {
    try {
      if (!isCancelled()) setIsHistoryLoading(true);
      const query = new URLSearchParams({
        search: searchValue,
        status: statusFilter,
        party_size: partyFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
        page: historyPage,
        per_page: 10,
      });

      if (forceRefresh) {
        query.append('refresh', '1');
      }

      const res = await fetch(`${API_BASE_URL}/api/history?${query.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat dining');
      const data = await res.json();
      if (!isCancelled()) {
        setHistoryData(data.data || []);
        setHistoryPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
      }
    } catch (err) {
      if (!isCancelled()) {
        console.error(err);
      }
    } finally {
      if (!isCancelled()) {
        setIsHistoryLoading(false);
      }
    }
  }, [searchValue, statusFilter, partyFilter, sortBy, sortDir, historyPage, API_BASE_URL]);

  // Real-time status polling (3 detik via Redis Cache)
  useEffect(() => {
    fetchStatus(false);

    const statusInterval = setInterval(() => {
      fetchStatus(false);
    }, 3000); // 3 detik polling stabil

    return () => clearInterval(statusInterval);
  }, [fetchStatus]);

  // History table auto-refresh (10 menit) & re-fetch saat filter berubah
  useEffect(() => {
    let cancelled = false;
    fetchHistory(() => cancelled);

    const historyInterval = setInterval(() => {
      fetchHistory(() => cancelled);
    }, 10 * 60 * 1000); // 10 menit (600.000 ms)

    return () => {
      cancelled = true;
      clearInterval(historyInterval);
    };
  }, [fetchHistory]);

  // Handler: Customer Arrival (POST /api/arrive)
  const handleCustomerArrival = async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/arrive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal memproses kedatangan');
    }

    if (data.status === 'seated') {
      showNotification(data.message, 'success', 'Pelanggan Berhasil Duduk!');
    } else {
      showNotification(data.message, 'warning', 'Masuk Antrean Prioritas');
    }

    await Promise.all([fetchStatus(), fetchHistory()]);
  };

  // Handler: Force Complete Table (POST /api/serve action=force)
  const handleForceComplete = async (tableId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/serve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ table_id: tableId, action: 'force' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengosongkan meja');

      showNotification(data.message, 'success', 'Meja Dikosongkan');
      await Promise.all([fetchStatus(), fetchHistory()]);
    } catch (err) {
      showNotification(err.message, 'error', 'Terjadi Kesalahan');
    }
  };

  // Handler: Drag and Drop Queue Customer to Table
  const handleDropQueueCustomer = async (queueCustomer, targetTable, isValid) => {
    if (!isValid) {
      if (targetTable.status === 'occupied') {
        showNotification(`Meja ${targetTable.code} sedang terisi pelanggan lain.`, 'error', 'Meja Terisi');
      } else if (queueCustomer.party_size > targetTable.capacity) {
        showNotification(
          `Gagal! Party size (${queueCustomer.party_size}) melebihi kapasitas Meja ${targetTable.code} (${targetTable.capacity}).`,
          'error',
          'Kapasitas Tidak Cukup'
        );
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/serve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          table_id: targetTable.id,
          queue_id: queueCustomer.id,
          action: 'assign',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menempatkan antrean ke meja');

      showNotification(data.message, 'success', 'Penempatan Berhasil');
      await Promise.all([fetchStatus(), fetchHistory()]);
    } catch (err) {
      showNotification(err.message, 'error', 'Terjadi Kesalahan');
    }
  };

  // Handler: Cancel Queue Item (DELETE /api/queue/{id})
  const handleCancelQueue = async (queueId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/queue/${queueId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membatalkan antrean');

      showNotification(data.message, 'success', 'Antrean Dibatalkan');
      await Promise.all([fetchStatus(), fetchHistory()]);
    } catch (err) {
      showNotification(err.message, 'error', 'Terjadi Kesalahan');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-12">
      {/* Navbar Header */}
      <Navbar
        onOpenArrivalModal={() => setIsArrivalModalOpen(true)}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onRefresh={() => {
          Promise.all([fetchStatus(true, true), fetchHistory(() => false, true)]);
        }}
        isRefreshing={isRefreshing}
      />

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-8 flex-1 w-full">
        {/* Main Grid: Left Floor Plan (2/3) + Right Queue Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <RestaurantGrid
              tables={tables}
              onForceComplete={handleForceComplete}
              onDropQueueCustomer={handleDropQueueCustomer}
              onRefresh={() => {
                Promise.all([fetchStatus(true, true), fetchHistory(() => false, true)]);
              }}
            />
          </div>

          <div className="lg:col-span-1">
            <QueueList
              queue={queue}
              onOpenArrivalModal={() => setIsArrivalModalOpen(true)}
              onCancelQueue={handleCancelQueue}
            />
          </div>
        </div>

        {/* History Table Section */}
        <div id="history-section">
          <HistoryTable
            historyData={historyData}
            pagination={historyPagination}
            searchValue={searchValue}
            statusFilter={statusFilter}
            partyFilter={partyFilter}
            sortBy={sortBy}
            sortDir={sortDir}
            isLoading={isHistoryLoading}
            onSearchChange={(val) => {
              setSearchValue(val);
              setHistoryPage(1);
            }}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setHistoryPage(1);
            }}
            onPartyFilterChange={(val) => {
              setPartyFilter(val);
              setHistoryPage(1);
            }}
            onSortChange={(col, dir) => {
              setSortBy(col);
              setSortDir(dir);
              setHistoryPage(1);
            }}
            onPageChange={setHistoryPage}
          />
        </div>
      </main>

      {/* Popup Notification Modal */}
      <NotificationModal
        isOpen={!!notification}
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Arrival Customer Modal */}
      <ArrivalModal
        isOpen={isArrivalModalOpen}
        onClose={() => setIsArrivalModalOpen(false)}
        onSubmit={handleCustomerArrival}
      />

      {/* Revenue Optimization Modal */}
      <RevenueModal isOpen={isRevenueModalOpen} onClose={() => setIsRevenueModalOpen(false)} />
    </div>
  );
}
