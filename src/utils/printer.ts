import { Order, StoreConfig } from '../types';

// Declare Sunmi global window interface extension
declare global {
  interface Window {
    SunmiPrinter?: {
      printText?: (text: string) => void;
      printOriginalText?: (text: string) => void;
      lineWrap?: (n: number) => void;
      printBarCode?: (code: string, symbology: number, height: number, width: number, textPosition: number) => void;
      printQRCode?: (data: string, modulesize: number, errorlevel: number) => void;
      cutPaper?: () => void;
    };
    sunmiInnerPrinter?: {
      printText?: (text: string, callback?: () => void) => void;
      printOriginalText?: (text: string, callback?: () => void) => void;
      lineWrap?: (n: number, callback?: () => void) => void;
      printQRCode?: (data: string, modulesize: number, errorlevel: number) => void;
      cutPaper?: () => void;
      setFontSize?: (size: number) => void;
      setAlignment?: (align: number) => void; // 0 left, 1 center, 2 right
    };
  }
}

// Convert Vietnamese accents to ASCII for maximum hardware ESC/POS thermal printer safety
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

// Store global USB printer device reference
let connectedUSBDevice: USBDevice | null = null;

export function getConnectedUSBDevice(): USBDevice | null {
  return connectedUSBDevice;
}

/**
 * Request & Connect to USB Thermal Printer via WebUSB API (Rongta / Xprinter / POS80)
 */
export async function connectUSBPrinter(): Promise<USBDevice> {
  if (!('usb' in navigator)) {
    throw new Error('Trình duyệt của bạn không hỗ trợ WebUSB API. Vui lòng sử dụng Chrome/Edge.');
  }

  try {
    const device = await navigator.usb.requestDevice({
      filters: [], // Request any USB device
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    // Find claimable interface
    const interfaceNumber = device.configuration?.interfaces[0]?.interfaceNumber || 0;
    try {
      await device.claimInterface(interfaceNumber);
    } catch {
      // Interface might already be claimed
    }

    connectedUSBDevice = device;
    return device;
  } catch (err: any) {
    console.error('Lỗi kết nối máy in USB:', err);
    throw new Error(err.message || 'Không thể kết nối với cổng USB máy in.');
  }
}

/**
 * Generate ESC/POS Command Stream
 */
export function buildESCPOSReceipt(order: Order, config: StoreConfig, isKitchenBill = false): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];

  const width = config.paperWidth === 58 ? 32 : 48; // Max characters per line
  const divider = '='.repeat(width);
  const lineDivider = '-'.repeat(width);

  // Helper functions
  const addBytes = (bytes: number[]) => commands.push(...bytes);
  const addText = (text: string) => {
    const safeText = removeVietnameseTones(text);
    const bytes = encoder.encode(safeText + '\n');
    commands.push(...Array.from(bytes));
  };

  // 1. Initialize Printer
  addBytes([0x1B, 0x40]); // ESC @

  if (!isKitchenBill) {
    // --- CUSTOMER BILL (HÓA ĐƠN THANH TOÁN) ---
    // Header Center Align
    addBytes([0x1B, 0x61, 0x01]); // Center
    addBytes([0x1D, 0x21, 0x11]); // Double height & width
    addText(config.storeName);
    addBytes([0x1D, 0x21, 0x00]); // Normal text
    addText(config.slogan);
    addText(config.address);
    addText(`Hotline: ${config.hotline}`);
    addText(`WiFi: ${config.wifiName} | Pass: ${config.wifiPassword}`);
    addText(divider);

    addBytes([0x1D, 0x21, 0x01]); // Double height
    addText('HOA DON THANH TOAN');
    addBytes([0x1D, 0x21, 0x00]); // Normal
    addText(`Ma HD: ${order.id}`);
    addText(`Ngay: ${new Date(order.createdAt).toLocaleString('vi-VN')}`);
    addText(`Loai: ${order.orderType === 'at_table' ? `Tai Ban (${order.tableName || 'N/A'})` : order.orderType === 'takeaway' ? 'Mang Ve' : 'Giao Hang'}`);
    addText(lineDivider);

    // Left Align Items
    addBytes([0x1B, 0x61, 0x00]);
    addText('Ten Mon              SL    Don Gia    T.Tien');
    addText(lineDivider);

    order.items.forEach((item) => {
      const name = removeVietnameseTones(item.menuItem.name).slice(0, 20).padEnd(20);
      const qty = item.quantity.toString().padStart(3);
      const price = formatVND(item.unitPrice).padStart(10);
      const total = formatVND(item.totalPrice).padStart(11);
      addText(`${name} ${qty} ${price} ${total}`);

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        item.selectedOptions.forEach((opt) => {
          addText(`   + ${opt.groupName}: ${opt.choiceName}`);
        });
      }
      if (item.notes) {
        addText(`   * Ghi chu: ${item.notes}`);
      }
    });

    addText(lineDivider);
    addText(`Tam tinh:               ${formatVND(order.subtotal).padStart(15)}`);
    if (order.discountAmount > 0) {
      addText(`Giam gia:              -${formatVND(order.discountAmount).padStart(15)}`);
    }
    addBytes([0x1B, 0x45, 0x01]); // Bold
    addBytes([0x1D, 0x21, 0x01]); // Larger
    addText(`TONG CONG:              ${formatVND(order.totalAmount).padStart(15)}`);
    addBytes([0x1B, 0x45, 0x00]); // Bold off
    addBytes([0x1D, 0x21, 0x00]); // Normal

    addText(lineDivider);
    const payMethodName = order.paymentMethod === 'cash' ? 'Tien Mat' : order.paymentMethod === 'transfer' ? 'Chuyen Khoan QR' : 'Vi Dien Tu';
    addText(`Hinh thuc TT: ${payMethodName}`);
    if (order.paymentMethod === 'cash' && order.cashGiven) {
      addText(`Tien khach đưa: ${formatVND(order.cashGiven)}`);
      addText(`Tien thoi lai:  ${formatVND(order.cashChange || 0)}`);
    }

    addBytes([0x1B, 0x61, 0x01]); // Center
    addText(divider);
    addText('Cam on quy khach & Hen gap lai!');
    addText('CHA CHI BAP - Ngon Chuan Vi Quang Ngai');
  } else {
    // --- KITCHEN BILL (PHIẾU CHẾ BIẾN BẾP) ---
    addBytes([0x1B, 0x61, 0x01]); // Center
    addBytes([0x1D, 0x21, 0x11]); // Double height & width
    addText('*** PHIEU BEP ***');
    addText(`DON: ${order.id}`);
    addBytes([0x1D, 0x21, 0x00]);
    addText(`Vi tri: ${order.orderType === 'at_table' ? `TAI BAN: ${order.tableName}` : order.orderType === 'takeaway' ? 'MANG VE' : 'GIAO HANG'}`);
    addText(`Thoi gian: ${new Date(order.createdAt).toLocaleTimeString('vi-VN')}`);
    addText(divider);

    addBytes([0x1B, 0x61, 0x00]); // Left
    addText('TEN MON                       SO LUONG');
    addText(lineDivider);

    order.items.forEach((item) => {
      addBytes([0x1D, 0x21, 0x01]); // Double height
      addBytes([0x1B, 0x45, 0x01]); // Bold
      const name = removeVietnameseTones(item.menuItem.name);
      addText(`${name}  x${item.quantity}`);
      addBytes([0x1B, 0x45, 0x00]);
      addBytes([0x1D, 0x21, 0x00]);

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        item.selectedOptions.forEach((opt) => {
          addText(`  --> ${opt.groupName}: ${opt.choiceName}`);
        });
      }
      if (item.notes) {
        addText(`  --> GHI CHU: ${item.notes.toUpperCase()}`);
      }
      addText('');
    });

    if (order.notes) {
      addText(lineDivider);
      addText(`GHI CHU CHUNG: ${order.notes}`);
    }
    addText(divider);
  }

  // Paper Feed & Cut
  addBytes([0x1B, 0x64, 0x05]); // Feed 5 lines
  addBytes([0x1D, 0x56, 0x41, 0x03]); // GS V 65 3 (Partial cut)

  return new Uint8Array(commands);
}

/**
 * Send ESC/POS payload to USB Device
 */
export async function sendESCPOSUSB(device: USBDevice, data: Uint8Array): Promise<void> {
  if (!device || !device.opened) {
    throw new Error('Máy in USB chưa được mở hoặc đã ngắt kết nối.');
  }

  // Find OUT endpoint
  const iface = device.configuration?.interfaces[0];
  const endpoint = iface?.alternate.endpoints.find((ep) => ep.direction === 'out');

  if (!endpoint) {
    throw new Error('Không tìm thấy cổng OUT endpoint trên thiết bị USB.');
  }

  await device.transferOut(endpoint.endpointNumber, data);
}

/**
 * Print to Sunmi D2 Native JS Bridge
 */
export function printSunmiNative(order: Order, config: StoreConfig, isKitchenBill = false): boolean {
  const printer = window.SunmiPrinter || window.sunmiInnerPrinter;
  if (!printer) return false;

  try {
    const text = isKitchenBill
      ? `*** PHIẾU BẾP ***\nĐƠN: ${order.id}\nVỊ TRÍ: ${order.tableName || 'MANG VỀ'}\n--------------------------------\n` +
        order.items.map((i) => `${i.menuItem.name} x${i.quantity}\n${i.notes ? `* Note: ${i.notes}\n` : ''}`).join('') +
        `--------------------------------\n`
      : `${config.storeName}\n${config.address}\nHÓA ĐƠN THANH TOÁN: ${order.id}\nThành tiền: ${formatVND(order.totalAmount)}\nCảm ơn quý khách!\n`;

    if (printer.printOriginalText) {
      printer.printOriginalText(text);
      if (printer.lineWrap) printer.lineWrap(4);
      if (printer.cutPaper) printer.cutPaper();
      return true;
    }
    if (printer.printText) {
      printer.printText(text);
      if (printer.lineWrap) printer.lineWrap(4);
      return true;
    }
  } catch (e) {
    console.error('Lỗi in Sunmi Native:', e);
  }
  return false;
}

/**
 * High-Level Print Dual Bill function (1 Bill Customer + 1 Bill Kitchen)
 */
export async function executePrintDualBill(
  order: Order,
  config: StoreConfig,
  usbDevice?: USBDevice | null
): Promise<{ success: boolean; message: string }> {
  let printedCount = 0;

  // 1. Check Sunmi Native Printer
  if (config.printerType === 'sunmi' || Boolean(window.SunmiPrinter || window.sunmiInnerPrinter)) {
    const p1 = printSunmiNative(order, config, false);
    let p2 = false;
    if (config.enableDualBill) {
      p2 = printSunmiNative(order, config, true);
    }
    if (p1) {
      return {
        success: true,
        message: config.enableDualBill
          ? 'Đã gửi in 2 bill (Khách + Bếp) thành công qua Sunmi D2!'
          : 'Đã gửi in bill thanh toán thành công qua Sunmi D2!',
      };
    }
  }

  // 2. Check WebUSB Thermal Printer
  const targetDevice = usbDevice || connectedUSBDevice;
  if (targetDevice && targetDevice.opened) {
    try {
      // Bill 1: Customer
      const billCustomer = buildESCPOSReceipt(order, config, false);
      await sendESCPOSUSB(targetDevice, billCustomer);
      printedCount++;

      // Bill 2: Kitchen (if dual bill enabled)
      if (config.enableDualBill) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause between cuts
        const billKitchen = buildESCPOSReceipt(order, config, true);
        await sendESCPOSUSB(targetDevice, billKitchen);
        printedCount++;
      }

      return {
        success: true,
        message: `Đã in thành công ${printedCount} bill qua cổng USB Rongta / ESC-POS!`,
      };
    } catch (err: any) {
      console.error('Lỗi khi gửi dữ liệu in USB:', err);
      return {
        success: false,
        message: `Lỗi máy in USB: ${err.message || 'Không thể gửi dữ liệu.'}`,
      };
    }
  }

  // 3. Fallback to Browser Print Dialog
  return {
    success: true,
    message: 'Mở cửa sổ xem trước & in phiếu trên trình duyệt.',
  };
}
