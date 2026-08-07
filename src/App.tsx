import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  ModifierGroup,
  Table,
  Order,
  Shift,
  StoreConfig,
  CartItem,
  OrderType,
  PaymentMethod,
  KitchenStatus,
} from './types/pos';
import {
  DEFAULT_STORE_CONFIG,
  INITIAL_MODIFIERS,
  INITIAL_MENU,
  INITIAL_TABLES,
  INITIAL_SHIFT,
  INITIAL_PAST_ORDERS,
} from './data/initialData';
import { Header, ViewTab } from './components/Header';
import { CashierPOS } from './components/CashierPOS';
import { TableManager } from './components/TableManager';
import { KitchenDisplay } from './components/KitchenDisplay';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { MenuManager } from './components/MenuManager';
import { ShiftManager } from './components/ShiftManager';
import { SettingsHardware } from './components/SettingsHardware';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptPrinterModal } from './components/ReceiptPrinterModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CashierTrainingGame } from './components/CashierTrainingGame';
import { GeminiApiKeyModal } from './components/GeminiApiKeyModal';
import {
  pushOrderToGoogleSheet,
  fetchMenuFromGoogleSheet,
  flushOfflineQueue,
} from './services/googleSheets';
import { exportSalesReportToDocx, exportMenuToDocx } from './services/docxExporter';
import { getStoredApiKey } from './services/aiAssistant';

export default function App() {
  // Persistence Helper
  const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        return initialValue;
      }
    });

    useEffect(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(error);
      }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
  };

  // Main App State
  const [activeTab, setActiveTab] = useState<ViewTab>('pos');
  const [storeConfig, setStoreConfig] = useLocalStorage<StoreConfig>('fnb_store_config', DEFAULT_STORE_CONFIG);
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('fnb_menu_items', INITIAL_MENU);
  const [modifierGroups, setModifierGroups] = useLocalStorage<ModifierGroup[]>('fnb_modifier_groups', INITIAL_MODIFIERS);
  const [tables, setTables] = useLocalStorage<Table[]>('fnb_tables', INITIAL_TABLES);
  const [orders, setOrders] = useLocalStorage<Order[]>('fnb_orders', INITIAL_PAST_ORDERS);
  const [shift, setShift] = useLocalStorage<Shift>('fnb_shift', INITIAL_SHIFT);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('gemini_selected_model', 'gemini-3-flash-preview');

  // Cashier Cart & Active Order State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('table');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [vatPercent, setVatPercent] = useState<number>(0);
  const [customerNote, setCustomerNote] = useState<string>('');

  // Modals State
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [isTrainingGameOpen, setIsTrainingGameOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Auto check API Key on initial mount as required by AI_INSTRUCTIONS.md
  useEffect(() => {
    const key = getStoredApiKey();
    if (!key) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Auto load menu & flush offline queue when online
  useEffect(() => {
    if (storeConfig.googleSheetsUrl && storeConfig.googleSheetsUrl.trim()) {
      fetchMenuFromGoogleSheet(storeConfig.googleSheetsUrl)
        .then((sheetMenu) => {
          if (sheetMenu && sheetMenu.length > 0) {
            setMenuItems(sheetMenu);
          }
        })
        .catch((err) => {
          console.warn('Không thể kết nối Google Sheet tự động:', err.message);
        });

      flushOfflineQueue(storeConfig.googleSheetsUrl);
    }

    const handleOnline = () => {
      if (storeConfig.googleSheetsUrl) {
        flushOfflineQueue(storeConfig.googleSheetsUrl);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [storeConfig.googleSheetsUrl]);

  // Sync selected table's order if exists
  useEffect(() => {
    if (selectedTable && selectedTable.currentOrderId) {
      const activeOrder = orders.find((o) => o.id === selectedTable.currentOrderId);
      if (activeOrder && activeOrder.paymentStatus === 'unpaid') {
        setCartItems(activeOrder.items);
        setDiscountPercent(activeOrder.discountPercent || 0);
        setVatPercent(activeOrder.vatPercent || 0);
        setCustomerNote(activeOrder.customerNote || '');
      }
    }
  }, [selectedTable]);

  // Handle Select Table for Order
  const handleSelectTableForOrder = (table: Table) => {
    setSelectedTable(table);
    setOrderType('table');

    if (table.currentOrderId) {
      const activeOrder = orders.find((o) => o.id === table.currentOrderId);
      if (activeOrder && activeOrder.paymentStatus === 'unpaid') {
        setCartItems(activeOrder.items);
        setDiscountPercent(activeOrder.discountPercent);
        setVatPercent(activeOrder.vatPercent);
        setCustomerNote(activeOrder.customerNote || '');
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }

    setActiveTab('pos');
  };

  // Send Order to Kitchen KDS
  const handleSendToKitchen = () => {
    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = Math.round((afterDiscount * vatPercent) / 100);
    const grandTotal = afterDiscount + vatAmount;

    let existingOrderIdx = -1;
    if (selectedTable && selectedTable.currentOrderId) {
      existingOrderIdx = orders.findIndex((o) => o.id === selectedTable.currentOrderId);
    }

    const orderId = existingOrderIdx >= 0 ? orders[existingOrderIdx].id : `HD-${1000 + orders.length + 1}`;

    const newOrder: Order = {
      id: orderId,
      orderCode: `POS${1000 + orders.length + 1}`,
      tableId: selectedTable?.id,
      tableName: selectedTable?.name,
      orderType,
      items: cartItems,
      subtotal,
      discountPercent,
      discountAmount,
      vatPercent,
      vatAmount,
      grandTotal,
      paymentStatus: 'unpaid',
      kitchenStatus: 'pending',
      cashierName: shift.cashierName,
      customerNote,
      createdAt: existingOrderIdx >= 0 ? orders[existingOrderIdx].createdAt : new Date().toISOString(),
    };

    if (existingOrderIdx >= 0) {
      const updatedOrders = [...orders];
      updatedOrders[existingOrderIdx] = newOrder;
      setOrders(updatedOrders);
    } else {
      setOrders([newOrder, ...orders]);
    }

    // Update Table status if table order
    if (selectedTable) {
      setTables(
        tables.map((t) =>
          t.id === selectedTable.id
            ? { ...t, status: 'occupied', currentOrderId: orderId }
            : t
        )
      );
    }

    alert(`Đã gửi đơn ${orderId} xuống Bếp chế biến Chả Giò!`);
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = Math.round((afterDiscount * vatPercent) / 100);
    const grandTotal = afterDiscount + vatAmount;

    let orderId = `HD-${1000 + orders.length + 1}`;
    if (selectedTable && selectedTable.currentOrderId) {
      orderId = selectedTable.currentOrderId;
    }

    const tempOrder: Order = {
      id: orderId,
      orderCode: `POS${1000 + orders.length + 1}`,
      tableId: selectedTable?.id,
      tableName: selectedTable?.name,
      orderType,
      items: cartItems,
      subtotal,
      discountPercent,
      discountAmount,
      vatPercent,
      vatAmount,
      grandTotal,
      paymentStatus: 'unpaid',
      kitchenStatus: 'pending',
      cashierName: shift.cashierName,
      customerNote,
      createdAt: new Date().toISOString(),
    };

    setPayingOrder(tempOrder);
  };

  // Pay directly from Table Manager
  const handlePayTableOrder = (order: Order) => {
    setPayingOrder(order);
  };

  // Confirm Payment
  const handleConfirmPayment = (
    method: PaymentMethod,
    paidAmount: number,
    changeAmount: number,
    autoPrint: boolean
  ) => {
    if (!payingOrder) return;

    const completedOrder: Order = {
      ...payingOrder,
      paymentMethod: method,
      paymentStatus: 'paid',
      paidAmount,
      changeAmount,
      completedAt: new Date().toISOString(),
    };

    // Upsert completed order into history
    const existingIdx = orders.findIndex((o) => o.id === completedOrder.id);
    if (existingIdx >= 0) {
      const updated = [...orders];
      updated[existingIdx] = completedOrder;
      setOrders(updated);
    } else {
      setOrders([completedOrder, ...orders]);
    }

    // Release table if associated
    if (completedOrder.tableId) {
      setTables(
        tables.map((t) =>
          t.id === completedOrder.tableId
            ? { ...t, status: 'empty', currentOrderId: undefined }
            : t
        )
      );
    }

    // Update Shift Revenue
    const rev = completedOrder.grandTotal;
    setShift((prev) => ({
      ...prev,
      totalRevenue: prev.totalRevenue + rev,
      totalOrders: prev.totalOrders + 1,
      cashRevenue: method === 'cash' ? prev.cashRevenue + rev : prev.cashRevenue,
      transferRevenue: method === 'transfer' ? prev.transferRevenue + rev : prev.transferRevenue,
      cardRevenue: method === 'card' || method === 'momo' ? prev.cardRevenue + rev : prev.cardRevenue,
      closingCashCalculated: method === 'cash' ? prev.closingCashCalculated + rev : prev.closingCashCalculated,
    }));

    // Auto Push Order to Google Sheet (with Offline Queue fallback)
    if (storeConfig.googleSheetsAutoSync && storeConfig.googleSheetsUrl) {
      pushOrderToGoogleSheet(storeConfig.googleSheetsUrl, completedOrder, true);
    }

    // Reset Cart
    setCartItems([]);
    setSelectedTable(null);
    setDiscountPercent(0);
    setVatPercent(0);
    setCustomerNote('');
    setPayingOrder(null);

    // Auto Print Trigger
    if (autoPrint) {
      setPrintingOrder(completedOrder);
    }
  };

  // Update Kitchen Status in KDS
  const handleUpdateKitchenStatus = (orderId: string, status: KitchenStatus) => {
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, kitchenStatus: status } : o))
    );
  };

  // Reset to Sample Data
  const handleResetData = () => {
    setStoreConfig(DEFAULT_STORE_CONFIG);
    setMenuItems(INITIAL_MENU);
    setModifierGroups(INITIAL_MODIFIERS);
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_PAST_ORDERS);
    setShift(INITIAL_SHIFT);
    setCartItems([]);
    setSelectedTable(null);
    alert('Đã khôi phục dữ liệu mẫu BÁN HÀNG CHẢ GIÒ ban đầu thành công!');
  };

  const kitchenPendingCount = orders.filter(
    (o) => o.kitchenStatus === 'pending' || o.kitchenStatus === 'preparing'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#1A1A1A] antialiased selection:bg-[#5A5A40] selection:text-white">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shift={shift}
        storeConfig={storeConfig}
        kitchenPendingCount={kitchenPendingCount}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onOpenAIAssistantModal={() => setIsAIAssistantModalOpen(true)}
        onOpenTrainingGame={() => setIsTrainingGameOpen(true)}
        onExportDocxReport={() => exportSalesReportToDocx(orders, shift, storeConfig)}
        onExportDocxMenu={() => exportMenuToDocx(menuItems, storeConfig)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && (
          <CashierPOS
            menuItems={menuItems}
            modifierGroups={modifierGroups}
            tables={tables}
            cartItems={cartItems}
            setCartItems={setCartItems}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            orderType={orderType}
            setOrderType={setOrderType}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            vatPercent={vatPercent}
            setVatPercent={setVatPercent}
            customerNote={customerNote}
            setCustomerNote={setCustomerNote}
            onSendToKitchen={handleSendToKitchen}
            onOpenPayment={handleOpenPayment}
            onOpenTableSelector={() => setActiveTab('tables')}
          />
        )}

        {activeTab === 'tables' && (
          <TableManager
            tables={tables}
            setTables={setTables}
            activeOrders={orders.filter((o) => o.paymentStatus === 'unpaid')}
            onSelectTableForOrder={handleSelectTableForOrder}
            onPayTableOrder={handlePayTableOrder}
          />
        )}

        {activeTab === 'kds' && (
          <KitchenDisplay
            orders={orders}
            onUpdateKitchenStatus={handleUpdateKitchenStatus}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAnalytics orders={orders} menuItems={menuItems} />
        )}

        {activeTab === 'menu' && (
          <MenuManager
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            modifierGroups={modifierGroups}
          />
        )}

        {activeTab === 'shift' && (
          <ShiftManager
            shift={shift}
            setShift={setShift}
            storeConfig={storeConfig}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsHardware
            storeConfig={storeConfig}
            setStoreConfig={setStoreConfig}
            onResetData={handleResetData}
            onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
          />
        )}
      </main>

      {/* Fast Payment Modal */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          storeConfig={storeConfig}
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* ESC/POS Thermal Receipt Printer Modal */}
      {printingOrder && (
        <ReceiptPrinterModal
          order={printingOrder}
          storeConfig={storeConfig}
          isOpen={!!printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* Google Sheets Database Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        storeConfig={storeConfig}
        setStoreConfig={setStoreConfig}
        menuItems={menuItems}
        setMenuItems={setMenuItems}
        orders={orders}
      />

      {/* Gemini AI Sales Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantModalOpen}
        onClose={() => setIsAIAssistantModalOpen(false)}
        menuItems={menuItems}
        storeConfig={storeConfig}
      />

      {/* Cashier Speed Training Game Modal */}
      <CashierTrainingGame
        isOpen={isTrainingGameOpen}
        onClose={() => setIsTrainingGameOpen(false)}
        menuItems={menuItems}
      />

      {/* Gemini API Key & Model Selection Modal */}
      <GeminiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
}
