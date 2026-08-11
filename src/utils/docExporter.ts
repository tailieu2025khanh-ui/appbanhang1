import { Order, StoreConfig } from '../types';
import { formatVND } from './printer';

/**
 * Export Official Word Document (.doc / .docx compatible format)
 * Inspired by docx-official skill
 */
export function exportWordReportDocx(orders: Order[], config: StoreConfig, dateStr: string) {
  const validOrders = orders.filter(
    (o) => o.orderStatus !== 'cancelled' && o.createdAt.startsWith(dateStr)
  );

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const cashRevenue = validOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const transferRevenue = validOrders
    .filter((o) => o.paymentMethod !== 'cash')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>BÁO CÁO KINH DOANH - ${config.storeName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; margin: 30px; }
        h1 { text-align: center; color: #1a1a1a; font-size: 18pt; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
        h2 { text-align: center; color: #cc5500; font-size: 13pt; font-style: italic; margin-top: 0; }
        .meta-info { margin-bottom: 20px; font-size: 11pt; border-bottom: 2px solid #cc5500; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #333333; padding: 8px 10px; font-size: 11pt; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .summary-box { background-color: #fff8e7; border: 1px solid #f59e0b; padding: 12px; margin-top: 15px; font-weight: bold; }
        .signature-table { margin-top: 40px; border: none; }
        .signature-table td { border: none; text-align: center; width: 50%; }
      </style>
    </head>
    <body>
      <h1>CỬA HÀNG ${config.storeName.toUpperCase()}</h1>
      <h2>${config.slogan}</h2>
      <div class="meta-info">
        <p><strong>Địa chỉ:</strong> ${config.address}</p>
        <p><strong>Hotline:</strong> ${config.hotline}</p>
        <p><strong>Ngày báo cáo:</strong> ${dateStr} (Xuất lúc ${new Date().toLocaleTimeString('vi-VN')})</p>
      </div>

      <h3>I. TỔNG HỢP DOANH THU CA LÀM VIỆC</h3>
      <div class="summary-box">
        <p>• TỔNG DOANH THU: ${formatVND(totalRevenue)}</p>
        <p>• Tổng số đơn hàng: ${validOrders.length} hóa đơn</p>
        <p>• Tiền mặt thu tại quầy: ${formatVND(cashRevenue)}</p>
        <p>• Chuyển khoản QR / Ví điện tử: ${formatVND(transferRevenue)}</p>
      </div>

      <h3>II. DANH SÁCH CHI TIẾT ĐƠN HÀNG</h3>
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã Đơn</th>
            <th>Thời Gian</th>
            <th>Vị Trí / Bàn</th>
            <th>Thanh Toán</th>
            <th>Tổng Tiền (VND)</th>
          </tr>
        </thead>
        <tbody>
          ${
            validOrders.length === 0
              ? '<tr><td colspan="6" style="text-align:center;">Chưa có đơn hàng nào trong ngày selected</td></tr>'
              : validOrders
                  .map(
                    (o, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="text-align:center;"><strong>${o.id}</strong></td>
                <td>${new Date(o.createdAt).toLocaleTimeString('vi-VN')}</td>
                <td>${o.tableName || (o.orderType === 'takeaway' ? 'Mang Về' : 'Giao Hàng')}</td>
                <td>${o.paymentMethod === 'cash' ? 'Tiền Mặt' : 'Chuyển Khoản QR'}</td>
                <td style="text-align:right;"><strong>${formatVND(o.totalAmount)}</strong></td>
              </tr>
            `
                  )
                  .join('')
          }
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td>
            <p><strong>NHÂN VIÊN THU NGÂN</strong></p>
            <p style="font-size:10pt; font-style:italic;">(Ký và ghi rõ họ tên)</p>
            <br><br><br>
          </td>
          <td>
            <p><strong>QUẢN LÝ CỬA HÀNG</strong></p>
            <p style="font-size:10pt; font-style:italic;">(Ký và ghi rõ họ tên)</p>
            <br><br><br>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BaoCao_Word_ChaGioBap_${dateStr}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export PowerPoint Deck (.pptx / Presentation Slide format)
 * Inspired by pptx-official skill
 */
export function exportPowerPointDeckPptx(orders: Order[], config: StoreConfig, dateStr: string) {
  const validOrders = orders.filter(
    (o) => o.orderStatus !== 'cancelled' && o.createdAt.startsWith(dateStr)
  );
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const htmlSlides = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>BÁO CÁO THUYẾT TRÌNH - ${config.storeName}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; }
        .slide { width: 900px; height: 500px; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #f59e0b; border-radius: 20px; margin: 30px auto; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
        .slide-header { border-bottom: 2px solid #f59e0b; padding-bottom: 15px; }
        .slide-title { font-size: 28px; font-weight: 900; color: #f59e0b; margin: 0; text-transform: uppercase; }
        .slide-subtitle { font-size: 14px; color: #94a3b8; margin-top: 5px; }
        .slide-body { flex: 1; margin-top: 25px; font-size: 18px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; }
        .kpi-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 20px; text-align: center; }
        .kpi-val { font-size: 32px; font-weight: 900; color: #10b981; margin-top: 10px; }
        .footer { font-size: 12px; color: #64748b; text-align: right; }
      </style>
    </head>
    <body>
      <!-- SLIDE 1: COVER -->
      <div class="slide">
        <div className="slide-header" style="border:none; text-align:center; margin-top:60px;">
          <h1 style="font-size:42px; color:#f59e0b; margin:0;">🌽 ${config.storeName.toUpperCase()}</h1>
          <p style="font-size:22px; color:#cbd5e1; margin-top:15px;">BÁO CÁO KINH DOANH HẰNG NGÀY POS 2026</p>
          <p style="font-size:16px; color:#94a3b8; font-style:italic;">${config.slogan}</p>
          <p style="font-size:14px; color:#10b981; font-weight:bold; margin-top:30px;">Ngày báo cáo: ${dateStr}</p>
        </div>
        <div class="footer">CHẢ GIÒ BẮP POS Presentation Deck</div>
      </div>

      <!-- SLIDE 2: KPI REVENUE OVERVIEW -->
      <div class="slide">
        <div class="slide-header">
          <h2 class="slide-title">TỔNG QUAN DOANH THU & CHỈ SỐ KPI</h2>
          <p class="slide-subtitle">Kết quả hoạt động kinh doanh bán hàng tại cửa hàng</p>
        </div>
        <div class="slide-body">
          <div class="kpi-grid">
            <div class="kpi-card">
              <div>TỔNG DOANH THU</div>
              <div class="kpi-val">${formatVND(totalRevenue)}</div>
            </div>
            <div class="kpi-card">
              <div>TỔNG ĐƠN HÀNG</div>
              <div class="kpi-val" style="color:#f59e0b;">${validOrders.length} Đơn</div>
            </div>
            <div class="kpi-card">
              <div>GIÁ TRỊ TB / ĐƠN</div>
              <div class="kpi-val" style="color:#3b82f6;">${formatVND(validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0)}</div>
            </div>
          </div>
        </div>
        <div class="footer">Slide 2 - CHẢ GIÒ BẮP Analytics</div>
      </div>

      <!-- SLIDE 3: STRATEGIC RECOMMENDATIONS -->
      <div class="slide">
        <div class="slide-header">
          <h2 class="slide-title">KHUYẾN NGHỊ & HƯỚNG TỚI</h2>
          <p class="slide-subtitle">Chiến lược tối ưu vận hành và doanh số</p>
        </div>
        <div class="slide-body" style="line-height:1.8;">
          <ul>
            <li>Tăng cường chuẩn bị <strong>Chả Giò Bắp nếp Quảng Ngãi</strong> vào khung giờ cao điểm từ 17:00 đến 20:00.</li>
            <li>Đẩy mạnh các gói <strong>Combo Chả Giò + Trà Tắc</strong> để nâng giá trị đơn hàng trung bình (AOV).</li>
            <li>Duy trì đồng bộ cơ sở dữ liệu trực tuyến <strong>Google Sheets Database</strong> 100% thời gian thực.</li>
          </ul>
        </div>
        <div class="footer">Slide 3 - CHẢ GIÒ BẮP Executive Summary</div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlSlides], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Slide_ThuyetTrinh_ChaGioBap_${dateStr}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
