import { MenuItem, Order, Shift, StoreConfig } from '../types/pos';

/**
 * Utility to trigger browser download of generated Blob
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Sales & Shift Report to formatted Microsoft Word (.doc / .docx)
 */
export function exportSalesReportToDocx(
  orders: Order[],
  shift: Shift,
  storeConfig: StoreConfig
) {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const orderRowsHtml = paidOrders
    .map(
      (o, i) => `
    <tr>
      <td style="border:1px solid #ddd; padding:8px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #ddd; padding:8px; font-weight:bold;">${o.id}</td>
      <td style="border:1px solid #ddd; padding:8px;">${new Date(o.createdAt).toLocaleTimeString('vi-VN')}</td>
      <td style="border:1px solid #ddd; padding:8px;">${o.tableName || (o.orderType === 'takeaway' ? 'Mang về' : 'Giao hàng')}</td>
      <td style="border:1px solid #ddd; padding:8px;">${(o.items || []).map((it) => `${it.menuItem.name} x${it.quantity}`).join(', ')}</td>
      <td style="border:1px solid #ddd; padding:8px; font-weight:bold; text-align:right;">${o.grandTotal.toLocaleString('vi-VN')}đ</td>
      <td style="border:1px solid #ddd; padding:8px; text-align:center;">${o.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
    </tr>
  `
    )
    .join('');

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Báo Cáo Doanh Thu - ${storeConfig.storeName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; }
        h1 { color: #5A5A40; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
        h3 { text-align: center; color: #555; font-weight: normal; margin-top: 0; }
        .summary-box { background-color: #FAF9F6; border: 2px solid #5A5A40; padding: 15px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #5A5A40; color: white; border: 1px solid #5A5A40; padding: 10px; text-align: left; }
        .footer-sig { margin-top: 40px; float: right; text-align: center; width: 250px; }
      </style>
    </head>
    <body>
      <h1>${storeConfig.storeName}</h1>
      <h3>BÁO CÁO DOANH THU BÁN HÀNG</h3>
      <p style="text-align:center;"><i>Ngày xuất báo cáo: ${currentDate} | Ca làm việc: ${shift.cashierName}</i></p>
      
      <div class="summary-box">
        <p><b>Địa chỉ cửa hàng:</b> ${storeConfig.address}</p>
        <p><b>Hotline liên hệ:</b> ${storeConfig.phone}</p>
        <p><b>Tổng số đơn hàng hoàn tất:</b> ${paidOrders.length} đơn</p>
        <p><b>TỔNG DOANH THU THU VỀ:</b> <span style="font-size:18px; color:#b91c1c; font-weight:bold;">${totalRevenue.toLocaleString('vi-VN')} VNĐ</span></p>
      </div>

      <h2>CHI TIẾT DANH SÁCH ĐƠN HÀNG</h2>
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã Đơn</th>
            <th>Thời Gian</th>
            <th>Bàn / Loại</th>
            <th>Chi Tiết Món Ăn</th>
            <th>Thành Tiền</th>
            <th>Thanh Toán</th>
          </tr>
        </thead>
        <tbody>
          ${orderRowsHtml || '<tr><td colspan="7" style="text-align:center;">Chưa có đơn hàng nào</td></tr>'}
        </tbody>
      </table>

      <div class="footer-sig">
        <p><i>Ngày ..... tháng ..... năm 2026</i></p>
        <p><b>Người Lập Báo Cáo</b></p>
        <br/><br/><br/>
        <p><b>${shift.cashierName}</b></p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword',
  });

  const fileName = `Bao_Cao_Doanh_Thu_Cha_Gio_${new Date().toISOString().slice(0, 10)}.doc`;
  downloadBlob(blob, fileName);
}

/**
 * Export Store Menu Catalog to formatted Microsoft Word (.doc / .docx)
 */
export function exportMenuToDocx(menuItems: MenuItem[], storeConfig: StoreConfig) {
  const menuRowsHtml = menuItems
    .map(
      (m, i) => `
    <tr>
      <td style="border:1px solid #ddd; padding:8px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #ddd; padding:8px; font-weight:bold;">${m.sku}</td>
      <td style="border:1px solid #ddd; padding:8px; font-weight:bold; color:#1A1A1A;">${m.name}</td>
      <td style="border:1px solid #ddd; padding:8px; text-align:center;">${m.category === 'mon-an' ? 'Món Chả Giò' : (m.category === 'nuoc-uong' ? 'Nước Giải Khát' : 'Combo')}</td>
      <td style="border:1px solid #ddd; padding:8px; font-weight:bold; color:#b91c1c; text-align:right;">${m.price.toLocaleString('vi-VN')}đ</td>
      <td style="border:1px solid #ddd; padding:8px; font-size:12px; color:#555;">${m.description || 'Thơm ngon đặc sản'}</td>
    </tr>
  `
    )
    .join('');

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Bảng Giá Thực Đơn - ${storeConfig.storeName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; }
        h1 { color: #5A5A40; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
        h3 { text-align: center; color: #c2410c; font-weight: bold; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #5A5A40; color: white; border: 1px solid #5A5A40; padding: 10px; text-align: left; }
      </style>
    </head>
    <body>
      <h1>${storeConfig.storeName}</h1>
      <h3>BẢNG GIÁ THỰC ĐƠN MÓN ĂN & NƯỚC UỐNG NIÊM YẾT</h3>
      <p style="text-align:center;">Địa chỉ: ${storeConfig.address} | Hotline: ${storeConfig.phone} | Wifi: ${storeConfig.wifiName} (${storeConfig.wifiPass})</p>
      
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã Món</th>
            <th>Tên Món Ăn / Đồ Uống</th>
            <th>Phân Loại</th>
            <th>Đơn Giá</th>
            <th>Mô Tả Hương Vị</th>
          </tr>
        </thead>
        <tbody>
          ${menuRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword',
  });

  const fileName = `Thuc_Don_${storeConfig.storeName.replace(/\s+/g, '_')}.doc`;
  downloadBlob(blob, fileName);
}
