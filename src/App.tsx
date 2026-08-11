import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { POSOrderView } from './components/POSOrderView';
import { TableLayoutView } from './components/TableLayoutView';
import { KDSView } from './components/KDSView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { MenuManagementView } from './components/MenuManagementView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';

import { ActiveTab, MenuItem, Table, Order, StoreConfig, OrderStatus } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_STORE_CONFIG } from './data/initialData';
import { connectUSBPrinter, executePrintDualBill, getConnectedUSBDevice } from './utils/printer';
import { syncOrderToGoogleSheets } from './utils/googleSheets';
import { MenuQuizModal } from './components/MenuQuizModal';
import { PINModal } from './components/PINModal';
import { GeminiKeyModal } from './components/GeminiKeyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // LocalStorage Persistence
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('chagiobap_pos_menu') || localStorage.getItem('chachibap_pos_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('chagiobap_pos_tables') || localStorage.getItem('chachibap_pos_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('chagiobap_pos_config') || localStorage.getItem('chachibap_pos_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.storeName === 'CHA CHI BAP') {
        parsed.storeName = 'CHẢ GIÒ BẮP';
      }
      return { ...INITIAL_STORE_CONFIG, ...parsed };
    }
    return INITIAL_STORE_CONFIG;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('chagiobap_pos_orders') || localStorage.getItem('chachibap_pos_orders');
    if (saved) return JSON.parse(saved);
    
    // Sample initial order
    const sample: Order = {
      id: 'POS1001',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      items: [
        {
          cartInstanceId: 'c1',
          menuItem: INITIAL_MENU_ITEMS[0],
          quantity: 2,
          selectedOptions: [{ groupName: 'Nước chấm', choiceName: 'Mắm nêm Quảng Ngãi', priceDelta: 0 }],
          unitPrice: 35000,
          totalPrice: 70000,
        },
        {
          cartInstanceId: 'c2',
          menuItem: INITIAL_MENU_ITEMS[10], // Trà Tắc
          quantity: 2,
          selectedOptions: [],
          unitPrice: 15000,
          totalPrice: 30000,
        },
      ],
      subtotal: 100000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 100000,
      orderType: 'at_table',
      tableId: 'tb2',
      tableName: 'Bàn 02',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'cooking',
    };
    return [sample];
  });

  const [usbConnected, setUsbConnected] = useState<boolean>(false);
  const [selectedTableForPOS, setSelectedTableForPOS] = useState<string | undefined>(undefined);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // New Features Modals State
  const [showMenuQuizModal, setShowMenuQuizModal] = useState<boolean>(false);
  const [pinTargetTab, setPinTargetTab] = useState<ActiveTab | null>(null);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);

  const handleSelectTabWithPin = (tab: ActiveTab) => {
    if (tab === 'settings' || tab === 'reports') {
      setPinTargetTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('chagiobap_pos_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('chagiobap_pos_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('chagiobap_pos_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('chagiobap_pos_orders', JSON.stringify(orders));
  }, [orders]);

  // Connect USB Printer
  const handleConnectUSBPrinter = async () => {
    try {
      await connectUSBPrinter();
      setUsbConnected(true);
      alert('Đã kết nối thành công với Máy in nhiệt USB Rongta / ESC-POS!');
    } catch (err: any) {
      alert(`Lỗi kết nối máy in USB: ${err.message}`);
    }
  };

  // Complete Order Flow
  const handleCompleteOrder = async (newOrder: Order, printReceipt: boolean) => {
    // 1. Save Order
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Update Table Status if At Table
    if (newOrder.tableId) {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === newOrder.tableId) {
            return {
              ...t,
              status: 'occupied',
              currentOrderId: newOrder.id,
              occupiedSince: newOrder.createdAt,
              totalAmount: newOrder.totalAmount,
            };
          }
          return t;
        })
      );
    }

    // 3. Confetti Animation
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    // 4. Print Thermal 2-Bill
    if (printReceipt) {
      setPrintingOrder(newOrder);
      const usbDev = getConnectedUSBDevice();
      executePrintDualBill(newOrder, config, usbDev);
    }

    // 5. Google Sheets Sync
    if (config.autoSyncSheet && config.googleSheetWebhookUrl) {
      syncOrderToGoogleSheets(newOrder, config);
    }
  };

  // KDS Status Updates
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
  };

  // Table Status Updates
  const handleUpdateTableStatus = (tableId: string, status: Table['status']) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status,
            currentOrderId: status === 'empty' ? undefined : t.currentOrderId,
            occupiedSince: status === 'empty' ? undefined : t.occupiedSince,
            totalAmount: status === 'empty' ? 0 : t.totalAmount,
          };
        }
        return t;
      })
    );
  };

  // Select Table for POS
  const handleSelectTableForOrder = (tableId: string) => {
    setSelectedTableForPOS(tableId);
    setActiveTab('pos');
  };

  // Menu Items CRUD
  const handleUpdateMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? item : m)));
  };

  const handleAddMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => [item, ...prev]);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    }
  };

  // Reprint Dual Bill
  const handleReprintDualBill = (order: Order) => {
    setPrintingOrder(order);
    const usbDev = getConnectedUSBDevice();
    executePrintDualBill(order, config, usbDev);
  };

  // Manual Sheet Sync
  const handleSyncSingleOrderToSheet = async (order: Order) => {
    const res = await syncOrderToGoogleSheets(order, config);
    alert(res.message);
  };

  const handleSyncAllToSheet = async () => {
    if (orders.length === 0) {
      alert('Chưa có đơn hàng nào để đồng bộ.');
      return;
    }
    let count = 0;
    for (const order of orders) {
      const res = await syncOrderToGoogleSheets(order, config);
      if (res.success) count++;
    }
    alert(`Đã hoàn tất đồng bộ ${count}/${orders.length} đơn hàng lên Google Sheets!`);
  };

  const pendingKDSCount = orders.filter(
    (o) => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled'
  ).length;

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col font-sans text-[#1A1A1A] selection:bg-[#F2A900] selection:text-[#1A1A1A]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleSelectTabWithPin}
        config={config}
        usbConnected={usbConnected}
        onConnectUSBPrinter={handleConnectUSBPrinter}
        pendingKDSCount={pendingKDSCount}
        onOpenMenuQuiz={() => setShowMenuQuizModal(true)}
        onOpenGeminiKeyModal={() => setShowGeminiModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <POSOrderView
            menuItems={menuItems}
            tables={tables}
            config={config}
            onCompleteOrder={handleCompleteOrder}
            selectedTableId={selectedTableForPOS}
            onClearSelectedTable={() => setSelectedTableForPOS(undefined)}
          />
        )}

        {activeTab === 'tables' && (
          <TableLayoutView
            tables={tables}
            orders={orders}
            onSelectTableForOrder={handleSelectTableForOrder}
            onUpdateTableStatus={handleUpdateTableStatus}
          />
        )}

        {activeTab === 'kds' && (
          <KDSView orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
        )}

        {activeTab === 'history' && (
          <OrderHistoryView
            orders={orders}
            config={config}
            onReprintDualBill={handleReprintDualBill}
            onCancelOrder={(id) => handleUpdateOrderStatus(id, 'cancelled')}
            onSyncSingleOrderToSheet={handleSyncSingleOrderToSheet}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManagementView
            menuItems={menuItems}
            onUpdateMenuItem={handleUpdateMenuItem}
            onAddMenuItem={handleAddMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            orders={orders}
            config={config}
            onSyncAllToSheet={handleSyncAllToSheet}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={setConfig}
            usbConnected={usbConnected}
            onConnectUSBPrinter={handleConnectUSBPrinter}
          />
        )}
      </main>

      {/* RECEIPT 2-BILL MODAL */}
      {printingOrder && (
        <ReceiptModal
          order={printingOrder}
          config={config}
          onClose={() => setPrintingOrder(null)}
          onPrintThermal={() => {
            const usbDev = getConnectedUSBDevice();
            executePrintDualBill(printingOrder, config, usbDev);
          }}
        />
      )}

      {/* STAFF MENU QUIZ TRAINING MODAL */}
      {showMenuQuizModal && (
        <MenuQuizModal
          menuItems={menuItems}
          config={config}
          onClose={() => setShowMenuQuizModal(false)}
        />
      )}

      {/* MANAGER PIN PROTECTION MODAL FOR SENSITIVE TABS */}
      {pinTargetTab && (
        <PINModal
          title={`Xác Thực PIN - ${pinTargetTab === 'settings' ? 'Cài Đặt Hệ Thống' : 'Báo Cáo Doanh Thu'}`}
          description={`Vui lòng nhập mã PIN Quản Lý (Mặc định: 1234) để mở trang ${
            pinTargetTab === 'settings' ? 'Cài Đặt' : 'Báo Cáo'
          }.`}
          onSuccess={() => {
            setActiveTab(pinTargetTab);
            setPinTargetTab(null);
          }}
          onClose={() => setPinTargetTab(null)}
        />
      )}

      {/* GEMINI AI API KEY & MODEL SETTINGS MODAL */}
      {showGeminiModal && (
        <GeminiKeyModal
          onClose={() => setShowGeminiModal(false)}
        />
      )}
    </div>
  );
}
