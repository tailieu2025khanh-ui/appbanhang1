import { MenuItem, Order, CategoryType } from '../types/pos';

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  itemsCount?: number;
  ordersCount?: number;
}

const OFFLINE_QUEUE_KEY = 'fnb_pending_orders_queue';

/**
 * Get queued offline orders from localStorage
 */
export function getOfflineQueue(): Order[] {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add order to offline queue
 */
export function addToOfflineQueue(order: Order): void {
  try {
    const queue = getOfflineQueue();
    if (!queue.some((o) => o.id === order.id)) {
      queue.push(order);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`Đã lưu đơn ${order.id} vào Offline Queue để đẩy sau.`);
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Flush and sync all offline queued orders to Google Sheet
 */
export async function flushOfflineQueue(url: string): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0 || !url || !isGoogleAppsScriptUrl(url)) return 0;

  let count = 0;
  const remainingQueue: Order[] = [];

  for (const order of queue) {
    try {
      const ok = await pushOrderToGoogleSheet(url, order, false);
      if (ok) {
        count++;
      } else {
        remainingQueue.push(order);
      }
    } catch (e) {
      remainingQueue.push(order);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  if (count > 0) {
    console.log(`Đã tự động đẩy ${count} đơn hàng trong Offline Queue lên Google Sheet!`);
  }
  return count;
}

/**
 * Extracts Google Spreadsheet ID from various URL formats
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  
  // Match standard spreadsheet URL: /spreadsheets/d/SPREADSHEET_ID/
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Match if user passed direct ID
  if (/^[a-zA-Z0-9-_]{25,60}$/.test(url.trim())) {
    return url.trim();
  }
  
  return null;
}

/**
 * Determines if URL is a Google Apps Script Web App deployment
 */
export function isGoogleAppsScriptUrl(url: string): boolean {
  return url.includes('script.google.com') && url.includes('/exec');
}

/**
 * Parse CSV string into array of objects or rows
 */
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentToken = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentToken.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Fetch Menu items from Google Sheet (via Apps Script Web App or Public CSV)
 */
export async function fetchMenuFromGoogleSheet(url: string): Promise<MenuItem[]> {
  if (!url || !url.trim()) {
    throw new Error('Vui lòng nhập đường dẫn Google Sheet hoặc Google Apps Script Web App URL.');
  }

  const cleanUrl = url.trim();

  // Case 1: Apps Script Web App URL
  if (isGoogleAppsScriptUrl(cleanUrl)) {
    const fetchUrl = cleanUrl.includes('?') 
      ? `${cleanUrl}&action=getMenu` 
      : `${cleanUrl}?action=getMenu`;
      
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Lỗi kết nối Web App: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.menu && Array.isArray(data.menu)) {
      return data.menu.map((item: any, idx: number) => ({
        id: item.id || `sheet_${idx + 1}`,
        sku: item.sku || `CG-${100 + idx}`,
        name: item.name || `Món ${idx + 1}`,
        category: (item.category as CategoryType) || 'mon-an',
        price: Number(item.price) || 0,
        image: item.image || 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60',
        isAvailable: item.isAvailable !== false,
        isBestSeller: item.isBestSeller === true || item.isBestSeller === 'true',
        description: item.description || '',
      }));
    }
    
    if (Array.isArray(data)) {
      return data.map((item: any, idx: number) => ({
        id: item.id || `sheet_${idx + 1}`,
        sku: item.sku || `CG-${100 + idx}`,
        name: item.name || `Món ${idx + 1}`,
        category: (item.category as CategoryType) || 'mon-an',
        price: Number(item.price) || 0,
        image: item.image || 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60',
        isAvailable: item.isAvailable !== false,
        description: item.description || '',
      }));
    }

    throw new Error('Dữ liệu trả về từ Apps Script không đúng định dạng danh sách thực đơn.');
  }

  // Case 2: Google Spreadsheet Public URL / Sheet ID -> Fetch as CSV
  const sheetId = extractSpreadsheetId(cleanUrl);
  let csvFetchUrl = cleanUrl;

  if (sheetId) {
    csvFetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  } else if (!cleanUrl.includes('out=csv') && !cleanUrl.includes('output=csv')) {
    throw new Error('URL không hợp lệ. Vui lòng dán liên kết Google Sheet công khai hoặc Google Apps Script Web App URL.');
  }

  const response = await fetch(csvFetchUrl);
  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu Google Sheet CSV (Mã lỗi ${response.status}). Vui lòng đảm bảo Sheet đã bật "Bất kỳ ai có liên kết đều có thể xem".`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error('Google Sheet rỗng hoặc chỉ có hàng tiêu đề.');
  }

  // Header row to find indices
  const headers = rows[0].map((h) => h.toLowerCase());
  
  const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('mã'));
  const skuIdx = headers.findIndex((h) => h.includes('sku') || h.includes('mã món'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('tên'));
  const categoryIdx = headers.findIndex((h) => h.includes('category') || h.includes('danh mục') || h.includes('loại'));
  const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('giá'));
  const imageIdx = headers.findIndex((h) => h.includes('image') || h.includes('ảnh') || h.includes('hình'));
  const availIdx = headers.findIndex((h) => h.includes('available') || h.includes('còn hàng') || h.includes('trạng thái'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('mô tả'));

  const parsedItems: MenuItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row.some((cell) => cell.trim().length > 0)) continue;

    const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : `Chả Giò Món ${i}`;
    const priceStr = priceIdx >= 0 && row[priceIdx] ? row[priceIdx].replace(/[^0-9]/g, '') : '0';
    const price = parseInt(priceStr, 10) || 0;

    let category: CategoryType = 'mon-an';
    if (categoryIdx >= 0 && row[categoryIdx]) {
      const catVal = row[categoryIdx].toLowerCase();
      if (catVal.includes('nước') || catVal.includes('uống') || catVal.includes('drink')) {
        category = 'nuoc-uong';
      } else if (catVal.includes('combo')) {
        category = 'combo';
      } else if (catVal.includes('topping') || catVal.includes('kèm')) {
        category = 'topping';
      }
    }

    const availStr = availIdx >= 0 && row[availIdx] ? row[availIdx].toLowerCase() : 'true';
    const isAvailable = availStr !== 'false' && availStr !== '0' && availStr !== 'hết';

    parsedItems.push({
      id: idIdx >= 0 && row[idIdx] ? row[idIdx] : `cg_item_${i}`,
      sku: skuIdx >= 0 && row[skuIdx] ? row[skuIdx] : `CG-${100 + i}`,
      name,
      category,
      price,
      image: imageIdx >= 0 && row[imageIdx] ? row[imageIdx] : 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60',
      isAvailable,
      description: descIdx >= 0 && row[descIdx] ? row[descIdx] : '',
    });
  }

  return parsedItems;
}

/**
 * Push an order to Google Sheet via Google Apps Script Web App with Offline Queue Fallback
 */
export async function pushOrderToGoogleSheet(
  url: string,
  order: Order,
  useQueueOnFail = true
): Promise<boolean> {
  if (!url || !url.trim() || !isGoogleAppsScriptUrl(url)) {
    console.warn('Google Apps Script Web App URL chưa được cấu hình để đẩy đơn hàng.');
    if (useQueueOnFail) addToOfflineQueue(order);
    return false;
  }

  if (!navigator.onLine) {
    console.warn('Thiết bị đang ngoại tuyến. Lưu đơn vào Offline Queue.');
    if (useQueueOnFail) addToOfflineQueue(order);
    return false;
  }

  try {
    const payload = {
      action: 'saveOrder',
      order,
    };

    await fetch(url.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error('Lỗi đẩy đơn hàng lên Google Sheet:', error);
    if (useQueueOnFail) addToOfflineQueue(order);
    return false;
  }
}

/**
 * Test Connection to Google Sheet
 */
export async function testGoogleSheetConnection(url: string): Promise<GoogleSheetsSyncResult> {
  try {
    const menu = await fetchMenuFromGoogleSheet(url);
    return {
      success: true,
      message: `Kết nối Google Sheet thành công! Đã đọc được ${menu.length} món ăn.`,
      itemsCount: menu.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Không thể kết nối tới Google Sheet.',
    };
  }
}

/**
 * Batch Push All Orders to Google Sheet
 */
export async function exportAllOrdersToGoogleSheet(url: string, orders: Order[]): Promise<GoogleSheetsSyncResult> {
  if (!url || !isGoogleAppsScriptUrl(url)) {
    return {
      success: false,
      message: 'Vui lòng nhập Google Apps Script Web App URL hợp lệ để đồng bộ nhiều đơn.',
    };
  }

  let count = 0;
  for (const order of orders) {
    const ok = await pushOrderToGoogleSheet(url, order, false);
    if (ok) count++;
  }

  return {
    success: true,
    message: `Đã đồng bộ thành công ${count}/${orders.length} đơn hàng lên Google Sheet!`,
    ordersCount: count,
  };
}

/**
 * Google Apps Script Template Code for users to copy
 */
export const APPS_SCRIPT_TEMPLATE = `// MÃ NGUỒN GOOGLE APPS SCRIPT CHO PHẦN MỀM "BÁN HÀNG CHẢ GIÒ"
// Hướng dẫn cài đặt:
// 1. Mở trang Google Sheet của bạn (https://sheets.google.com)
// 2. Vào menu "Tiện ích mở rộng" (Extensions) -> Chọn "Apps Script"
// 3. Xóa hết mã cũ và dán toàn bộ đoạn mã bên dưới vào
// 4. Nhấn "Triển khai" (Deploy) -> "Triển khai dưới dạng ứng dụng web" (New deployment)
// 5. Cấu hình: 
//    - Người thực thi: "Tôi" (Me)
//    - Người có quyền truy cập: "Bất kỳ ai" (Anyone)
// 6. Nhấn "Triển khai", cấp quyền và Sao chép URL Web App thu được dán vào ứng dụng BÁN HÀNG CHẢ GIÒ.

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getMenu";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "getMenu") {
    var sheet = ss.getSheetByName("ThucDon") || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    var items = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[2]) continue;
      items.push({
        id: String(row[0] || 'cg_' + i),
        sku: String(row[1] || 'CG-' + (100 + i)),
        name: String(row[2] || 'Món ' + i),
        category: String(row[3] || 'mon-an').toLowerCase(),
        price: Number(row[4] || 0),
        image: String(row[5] || 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60'),
        isAvailable: row[6] !== false && String(row[6]).toLowerCase() !== 'false',
        description: String(row[7] || '')
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, menu: items }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "OK", app: "BÁN HÀNG CHẢ GIÒ POS" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (contents.action === "saveOrder" || contents.order) {
      var order = contents.order || contents;
      var sheet = ss.getSheetByName("DonHang");
      if (!sheet) {
        sheet = ss.insertSheet("DonHang");
        sheet.appendRow([
          "Mã Đơn", "Thời Gian", "Loại Đơn", "Bàn", 
          "Chi Tiết Món", "Tổng Tiền Món", "Giảm Giá", "VAT", 
          "Thành Tiền", "Thanh Toán", "Thu Ngân", "Ghi Chú"
        ]);
        sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#5A5A40").setFontColor("#FFFFFF");
      }
      
      var itemsStr = (order.items || []).map(function(it) {
        var mods = (it.selectedModifiers || []).map(function(m) { return m.optionName; }).join(", ");
        return (it.menuItem ? it.menuItem.name : "Món") + " x" + it.quantity + (mods ? " (" + mods + ")" : "");
      }).join("; ");
      
      sheet.appendRow([
        order.id || order.orderCode,
        order.createdAt || new Date().toISOString(),
        order.orderType === 'table' ? 'Tại bàn' : (order.orderType === 'takeaway' ? 'Mang về' : 'Giao hàng'),
        order.tableName || "",
        itemsStr,
        order.subtotal || 0,
        order.discountAmount || 0,
        order.vatAmount || 0,
        order.grandTotal || 0,
        order.paymentMethod || "Tiền mặt",
        order.cashierName || "",
        order.customerNote || ""
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Đã ghi đơn thành công" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
