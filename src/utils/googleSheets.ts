import { Order, StoreConfig, DailyRevenueOnlineData } from '../types';
import { formatVND } from './printer';

export interface SyncResponse {
  success: boolean;
  message: string;
}

/**
 * Sync Order data to Google Sheets via Webhook (Google Apps Script)
 */
export async function syncOrderToGoogleSheets(
  order: Order,
  config: StoreConfig
): Promise<SyncResponse> {
  const url = config.googleSheetWebhookUrl;
  if (!url || !url.startsWith('http') || url.includes('EXAMPLE')) {
    return {
      success: false,
      message: 'Chưa cấu hình Google Sheets Webhook URL hợp lệ trong mục Cài Đặt.',
    };
  }

  const itemsFormatted = order.items
    .map((item) => {
      const opts = item.selectedOptions.map((o) => o.choiceName).join(', ');
      return `${item.menuItem.name} (x${item.quantity})${opts ? ` [${opts}]` : ''}${item.notes ? ` {Note: ${item.notes}}` : ''}`;
    })
    .join('; ');

  const payload = {
    action: 'ADD_ORDER',
    storeName: config.storeName,
    orderId: order.id,
    createdAt: new Date(order.createdAt).toLocaleString('vi-VN'),
    dateKey: new Date(order.createdAt).toISOString().slice(0, 10),
    tableName: order.tableName || (order.orderType === 'takeaway' ? 'Mang Về' : 'Giao Hàng'),
    orderType: order.orderType === 'at_table' ? 'Tại Bàn' : order.orderType === 'takeaway' ? 'Mang Về' : 'Giao Hàng',
    items: itemsFormatted,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    totalFormatted: formatVND(order.totalAmount),
    paymentMethod: order.paymentMethod === 'cash' ? 'Tiền Mặt' : order.paymentMethod === 'transfer' ? 'Chuyển Khoản QR' : 'Ví Điện Tử',
    paymentStatus: order.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán',
    orderStatus: order.orderStatus,
    customerNotes: order.notes || '',
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Đã đồng bộ đơn hàng ${order.id} lên Google Sheet thành công!`,
    };
  } catch (err: any) {
    console.error('Lỗi sync Google Sheets:', err);
    return {
      success: false,
      message: `Không thể kết nối Webhook: ${err.message || 'Lỗi mạng'}.`,
    };
  }
}

/**
 * Fetch online daily total revenue from Google Sheets Database via Webhook / GET Endpoint
 */
export async function fetchDailyRevenueFromGoogleSheets(
  config: StoreConfig,
  targetDate?: string
): Promise<DailyRevenueOnlineData> {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10);
  const url = config.googleSheetReadUrl || config.googleSheetWebhookUrl;

  if (!url || !url.startsWith('http') || url.includes('EXAMPLE')) {
    return {
      success: false,
      message: 'Chưa cấu hình Google Sheet Webhook URL hợp lệ trong Cài Đặt.',
      date: dateStr,
      totalRevenue: 0,
      totalOrders: 0,
      lastUpdated: new Date().toLocaleTimeString('vi-VN'),
    };
  }

  try {
    // Attempt GET request with action=GET_DAILY_REVENUE
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}action=GET_DAILY_REVENUE&date=${dateStr}&t=${Date.now()}`;

    const res = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error status: ${res.status}`);
    }

    const data = await res.json();
    if (data && data.success) {
      return {
        success: true,
        message: data.message || 'Tải dữ liệu doanh thu trực tuyến từ Google Sheets thành công!',
        date: data.date || dateStr,
        totalRevenue: Number(data.totalRevenue) || 0,
        totalOrders: Number(data.totalOrders) || 0,
        lastUpdated: new Date().toLocaleTimeString('vi-VN'),
        detailsByPaymentMethod: data.detailsByPaymentMethod || { cash: 0, transfer: 0 },
      };
    } else {
      return {
        success: false,
        message: data.message || 'Không thể lấy dữ liệu doanh thu từ Google Sheets.',
        date: dateStr,
        totalRevenue: 0,
        totalOrders: 0,
        lastUpdated: new Date().toLocaleTimeString('vi-VN'),
      };
    }
  } catch (err: any) {
    console.warn('Không thể thực hiện GET trực tiếp (có thể do CORS Google Apps Script), chuyển sang POST fetch:', err);

    // Fallback attempt via POST JSON
    try {
      const postRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'GET_DAILY_REVENUE',
          date: dateStr,
        }),
      });

      const postData = await postRes.json();
      if (postData && postData.success) {
        return {
          success: true,
          message: postData.message || 'Kết nối thành công Database Google Sheets trực tuyến!',
          date: postData.date || dateStr,
          totalRevenue: Number(postData.totalRevenue) || 0,
          totalOrders: Number(postData.totalOrders) || 0,
          lastUpdated: new Date().toLocaleTimeString('vi-VN'),
          detailsByPaymentMethod: postData.detailsByPaymentMethod || { cash: 0, transfer: 0 },
        };
      }
    } catch (postErr: any) {
      console.error('Lỗi POST fallback:', postErr);
    }

    return {
      success: false,
      message: `Lỗi kết nối trực tuyến: ${err.message || 'Không thể truy vấn Google Sheets Webhook'}. Vui lòng kiểm tra lại Google Apps Script đã triển khai đúng chuẩn Web App chưa.`,
      date: dateStr,
      totalRevenue: 0,
      totalOrders: 0,
      lastUpdated: new Date().toLocaleTimeString('vi-VN'),
    };
  }
}

/**
 * Full Template Code for Google Apps Script to paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * CHẢ GIÒ BẮP POS - GOOGLE APPS SCRIPT DATABASE BACKEND
 * Dán mã này vào Google Sheets (Tiện ích mở rộng -> Apps Script)
 * Chọn "Triển khai" -> "Triển khai dưới dạng ứng dụng web" -> Quyền truy cập: "Bất kỳ ai" (Anyone)
 */

function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || 'GET_DAILY_REVENUE';
  var dateStr = params.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

  if (action === 'GET_DAILY_REVENUE') {
    var result = getDailyRevenue(dateStr);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "CHẢ GIÒ BẮP POS Webhook OK" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var action = data.action || 'ADD_ORDER';

    if (action === 'GET_DAILY_REVENUE') {
      var dateStr = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      var result = getDailyRevenue(dateStr);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'ADD_ORDER') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Mã Đơn", "Thời Gian", "Ngày (YYYY-MM-DD)", "Cửa Hàng", "Bàn/Vị Trí",
          "Loại Đơn", "Danh Sách Món", "Tạm Tính", "Giảm Giá", "Tổng Tiền (VND)",
          "Thanh Toán", "Trạng Thái TT", "Trạng Thái Đơn", "Ghi Chú Khách"
        ]);
      }

      sheet.appendRow([
        data.orderId,
        data.createdAt,
        data.dateKey || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
        data.storeName,
        data.tableName,
        data.orderType,
        data.items,
        data.subtotal,
        data.discountAmount,
        data.totalAmount,
        data.paymentMethod,
        data.paymentStatus,
        data.orderStatus,
        data.customerNotes
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Đã lưu đơn hàng " + data.orderId + " vào Google Sheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Lỗi xử lý Webhook: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getDailyRevenue(targetDate) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { success: true, date: targetDate, totalRevenue: 0, totalOrders: 0, detailsByPaymentMethod: { cash: 0, transfer: 0 } };
  }

  var totalRevenue = 0;
  var totalOrders = 0;
  var cash = 0;
  var transfer = 0;

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var createdAtStr = String(row[1] || "");
    var dateKey = String(row[2] || "");
    var orderStatus = String(row[12] || "");
    var amount = Number(row[9]) || 0;
    var payMethod = String(row[10] || "");

    if (orderStatus === "cancelled") continue;

    var isMatchingDate = dateKey.indexOf(targetDate) !== -1 || createdAtStr.indexOf(targetDate) !== -1;
    if (isMatchingDate || !targetDate) {
      totalRevenue += amount;
      totalOrders++;
      if (payMethod.indexOf("Tiền Mặt") !== -1) {
        cash += amount;
      } else {
        transfer += amount;
      }
    }
  }

  return {
    success: true,
    message: "Lấy tổng doanh thu ngày " + targetDate + " từ Google Sheets thành công!",
    date: targetDate,
    totalRevenue: totalRevenue,
    totalOrders: totalOrders,
    detailsByPaymentMethod: { cash: cash, transfer: transfer }
  };
}
`;
