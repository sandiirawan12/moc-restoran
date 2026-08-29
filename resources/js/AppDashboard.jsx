import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import RestaurantGrid from './components/RestaurantGrid';
import QueueList from './components/QueueList';
import HistoryTable from './components/HistoryTable';
import ArrivalModal from './components/ArrivalModal';
import RevenueModal from './components/RevenueModal';
import NotificationModal from './components/NotificationModal';

export default function AppDashboard() {
  const [tables, setTables] = useState([]);
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

  // Modals state
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Popup Notification Modal state
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info', title = null) => {
    setNotification({ message, type, title });
  };

  // Fetch real-time status (tables & queue)
  const fetchStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Gagal mengambil status restoran');
      const data = await res.json();
      setTables(data.tables || []);
      setQueue(data.queue || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch history list
  const fetchHistory = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        search: searchValue,
        status: statusFilter,
        party_size: partyFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
        page: historyPage,
        per_page: 10,
      });

      const res = await fetch(`/api/history?${query.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat dining');
      const data = await res.json();
      setHistoryData(data.data || []);
      setHistoryPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
    }
  }, [searchValue, statusFilter, partyFilter, sortBy, sortDir, historyPage]);

  // Initial load & 3s polling
  useEffect(() => {
    fetchStatus();
    fetchHistory();

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchHistory]);

  // Re-fetch history whenever search/filter/sort changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handler: Customer Arrival (POST /api/arrive)
  const handleCustomerArrival = async (payload) => {
    const res = await fetch('/api/arrive', {
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

    fetchStatus();
  };

  // Handler: Force Complete Table (POST /api/serve action=force)
  const handleForceComplete = async (tableId) => {
    try {
      const res = await fetch('/api/serve', {
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
      fetchStatus();
      fetchHistory();
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
      const res = await fetch('/api/serve', {
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
      fetchStatus();
    } catch (err) {
      showNotification(err.message, 'error', 'Terjadi Kesalahan');
    }
  };

  // Handler: Cancel Queue Item (DELETE /api/queue/{id})
  const handleCancelQueue = async (queueId) => {
    try {
      const res = await fetch(`/api/queue/${queueId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membatalkan antrean');

      showNotification(data.message, 'success', 'Antrean Dibatalkan');
      fetchStatus();
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
          fetchStatus();
          fetchHistory();
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
                fetchStatus();
                fetchHistory();
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
            onSearchChange={setSearchValue}
            onStatusFilterChange={setStatusFilter}
            onPartyFilterChange={setPartyFilter}
            onSortChange={(col, dir) => {
              setSortBy(col);
              setSortDir(dir);
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
