// ============================================================
// הפרתיה v3 — Google Apps Script Backend
// ============================================================
// הגדר כאן את ה-ID של ה-Spreadsheet החדש שלך:
const SHEET_ID = '1ANaiZRPldIIK_hTZiw3m0fULzaEbwUbwC3OtCFzaJmM';

// ============================================================
// HELPERS
// ============================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function ensureSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    Logger.log('נוצר גיליון: ' + name);
  }
  return sheet;
}

function fmtDate(d) {
  return Utilities.formatDate(d, 'Asia/Jerusalem', 'dd/MM/yyyy');
}

// V8 runtime: instanceof Date can fail for Date objects from getValues()
// Use duck-typing instead
function isDate(v) {
  return v && typeof v.getTime === 'function';
}

function fmtTime(d) {
  return Utilities.formatDate(d, 'Asia/Jerusalem', 'HH:mm');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// PRODUCTS
// Schema: שם(0), מחיר(1), פעיל(2), קטגוריה(3), אייקון(4), requiresPreparation(5)
// ============================================================

function getProducts() {
  try {
    const HEADERS = ['שם', 'מחיר', 'פעיל', 'קטגוריה', 'אייקון', 'requiresPreparation'];
    const sheet = ensureSheet('מוצרים', HEADERS);

    // אתחול ראשוני אם ריק
    if (sheet.getLastRow() <= 1) {
      const defaults = [
        ['בירה', 15, 'כן', 'משקאות', '🍺', 'לא'],
        ['יין אדום', 25, 'כן', 'אלכוהול', '🍷', 'לא'],
        ['יין לבן', 25, 'כן', 'אלכוהול', '🥂', 'לא'],
        ['יין רוזה', 25, 'כן', 'אלכוהול', '🌹', 'לא'],
        ['לימונערק', 30, 'כן', 'קוקטיילים', '🍋', 'כן'],
        ["ויסקי סאוור ליצ'י", 30, 'כן', 'קוקטיילים', '🥃', 'כן'],
        ['ויסקי סאוור אננס', 30, 'כן', 'קוקטיילים', '🍍', 'כן'],
        ['מוחיטו', 30, 'כן', 'קוקטיילים', '🌿', 'כן'],
        ['אפרול שפריץ', 30, 'כן', 'קוקטיילים', '🍊', 'כן'],
        ['שתיה קלה', 5, 'כן', 'משקאות', '🥤', 'לא'],
        ['סיידר', 18, 'כן', 'משקאות', '🍏', 'לא'],
      ];
      defaults.forEach(r => sheet.appendRow(r));
    }

    const data = sheet.getDataRange().getValues();
    const products = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (r[2] === 'כן') {
        products.push({
          name: r[0] || '',
          price: parseInt(r[1]) || 0,
          category: r[3] || 'כללי',
          emoji: r[4] || '🍽️',
          requiresPreparation: r[5] !== 'לא' && r[5] !== false
        });
      }
    }
    return { success: true, products };
  } catch (e) {
    Logger.log('getProducts error: ' + e);
    return { success: false, message: e.toString(), products: [] };
  }
}

function getAllProductsForReports() {
  try {
    const sheet = getSheet('מוצרים');
    if (!sheet) return { success: false, products: [] };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, products: [] };
    const products = data.slice(1).map(r => ({
      name: r[0] || '',
      price: parseInt(r[1]) || 0,
      active: r[2] || 'לא',
      category: r[3] || 'כללי',
      emoji: r[4] || '🍽️',
      requiresPreparation: r[5] !== 'לא' && r[5] !== false
    }));
    return { success: true, products };
  } catch (e) {
    return { success: false, message: e.toString(), products: [] };
  }
}

function addProduct(data) {
  try {
    const sheet = ensureSheet('מוצרים', ['שם', 'מחיר', 'פעיל', 'קטגוריה', 'אייקון', 'requiresPreparation']);
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === data.name) return { success: false, message: 'מוצר עם שם זה כבר קיים' };
    }
    sheet.appendRow([
      data.name,
      parseInt(data.price) || 0,
      'כן',
      data.category || 'כללי',
      data.emoji || '🍽️',
      (data.requiresPreparation === 'true' || data.requiresPreparation === true) ? 'כן' : 'לא'
    ]);
    return { success: true, message: 'מוצר נוסף בהצלחה' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updateProduct(data) {
  try {
    const sheet = getSheet('מוצרים');
    if (!sheet) return { success: false, message: 'גיליון מוצרים לא נמצא' };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.name) {
        if (data.price !== undefined) sheet.getRange(i+1,2).setValue(parseInt(data.price));
        if (data.active !== undefined) sheet.getRange(i+1,3).setValue(data.active === 'true' || data.active === true ? 'כן' : 'לא');
        if (data.category !== undefined) sheet.getRange(i+1,4).setValue(data.category);
        if (data.emoji !== undefined) sheet.getRange(i+1,5).setValue(data.emoji);
        if (data.requiresPreparation !== undefined) sheet.getRange(i+1,6).setValue(data.requiresPreparation === 'true' || data.requiresPreparation === true ? 'כן' : 'לא');
        return { success: true, message: 'מוצר עודכן בהצלחה' };
      }
    }
    return { success: false, message: 'מוצר לא נמצא: ' + data.name };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function deleteProduct(name) {
  try {
    const sheet = getSheet('מוצרים');
    if (!sheet) return { success: false, message: 'גיליון מוצרים לא נמצא' };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === name) {
        sheet.getRange(i+1, 3).setValue('לא');
        return { success: true, message: 'מוצר הוסר בהצלחה' };
      }
    }
    return { success: false, message: 'מוצר לא נמצא: ' + name };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================================
// RESIDENTS
// Schema: שם מלא(0), כינוי(1), פעיל(2), סוג מגורים(3), הערות(4)
// ============================================================

// נרמול שם ישוב — מאפשר שמירה לאחור עם "כפר עדום"
function normalizeSettlement(s) {
  if (!s) return s;
  return s === 'כפר עדום' ? 'כפר אדומים' : s;
}

function getResidents() {
  try {
    const HEADERS = ['שם מלא', 'כינוי', 'פעיל', 'סוג מגורים', 'הערות'];
    const sheet = ensureSheet('תושבים', HEADERS);
    if (sheet.getLastRow() <= 1) {
      const defaults = [
        ['נופית פרתוש', 'נופית', 'כן', 'נופי פרת', 'מייסדת הפרתיה'],
        ['יוסי מאור', 'יוסי', 'כן', 'נופי פרת', ''],
        ['דני כהן', 'דני', 'כן', 'נופי פרת', ''],
      ];
      defaults.forEach(r => sheet.appendRow(r));
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, residents: [] };
    const residents = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (r[2] === 'כן') {
        residents.push({
          fullName: r[0] || '',
          nickname: r[1] || '',
          residenceType: normalizeSettlement(r[3] || 'נופי פרת'),
          notes: r[4] || ''
        });
      }
    }
    return { success: true, residents };
  } catch (e) {
    return { success: false, message: e.toString(), residents: [] };
  }
}

function getAllResidents() {
  try {
    const sheet = getSheet('תושבים');
    if (!sheet) return { success: false, residents: [] };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, residents: [] };
    const residents = data.slice(1).map(r => ({
      fullName: r[0] || '',
      nickname: r[1] || '',
      active: r[2] || 'לא',
      residenceType: normalizeSettlement(r[3] || 'נופי פרת'),
      notes: r[4] || ''
    }));
    return { success: true, residents };
  } catch (e) {
    return { success: false, message: e.toString(), residents: [] };
  }
}

function addResident(data) {
  try {
    const sheet = ensureSheet('תושבים', ['שם מלא', 'כינוי', 'פעיל', 'סוג מגורים', 'הערות']);
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === data.fullName) return { success: false, message: 'תושב עם שם זה כבר קיים' };
    }
    sheet.appendRow([
      data.fullName,
      data.nickname || '',
      'כן',
      data.residenceType || 'נופי פרת',
      data.notes || ''
    ]);
    return { success: true, message: 'תושב נוסף בהצלחה' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updateResident(data) {
  try {
    const sheet = getSheet('תושבים');
    if (!sheet) return { success: false, message: 'גיליון תושבים לא נמצא' };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.fullName) {
        if (data.nickname !== undefined) sheet.getRange(i+1,2).setValue(data.nickname);
        if (data.active !== undefined) sheet.getRange(i+1,3).setValue(data.active === 'false' || data.active === false ? 'לא' : 'כן');
        if (data.residenceType !== undefined) sheet.getRange(i+1,4).setValue(data.residenceType);
        if (data.notes !== undefined) sheet.getRange(i+1,5).setValue(data.notes);
        return { success: true, message: 'תושב עודכן בהצלחה' };
      }
    }
    return { success: false, message: 'תושב לא נמצא: ' + data.fullName };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================================
// ORDERS
// Schema: תאריך(0), שעה(1), שם(2), מוצרים(3), סכום(4), מזהה(5), סטטוס(6), סוג תושב(7), סוג הזמנה(8)
// ============================================================

function addOrder(orderData) {
  try {
    const HEADERS = ['תאריך', 'שעה', 'שם', 'מוצרים', 'סכום', 'מזהה', 'סטטוס', 'סוג תושב', 'סוג הזמנה'];
    const ordersSheet = ensureSheet('סיכום הזמנות', HEADERS);
    const now = new Date();
    const orderId = Utilities.getUuid().substring(0, 8);
    const orderType = orderData.isCredit ? 'זיכוי' : 'רגילה';
    ordersSheet.appendRow([
      fmtDate(now), fmtTime(now),
      orderData.customerName, orderData.products,
      orderData.total, orderId,
      'pending', orderData.residenceType || '', orderType
    ]);
    if (!orderData.isCredit) {
      createActiveItems(orderData, orderId);
    }
    return { success: true, message: 'הזמנה נוספה בהצלחה', orderId };
  } catch (e) {
    Logger.log('addOrder error: ' + e);
    return { success: false, message: e.toString() };
  }
}

function updateOrder(orderId, products, total) {
  try {
    const ordersSheet = getSheet('סיכום הזמנות');
    if (!ordersSheet) return { success: false, message: 'גיליון הזמנות לא נמצא' };
    const data = ordersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === orderId) {
        ordersSheet.getRange(i+1, 4).setValue(products);
        ordersSheet.getRange(i+1, 5).setValue(total);
        // מחיקת פריטים פעילים קיימים
        const activeSheet = getSheet('פריטים פעילים');
        if (activeSheet) {
          const ad = activeSheet.getDataRange().getValues();
          for (let j = ad.length - 1; j >= 1; j--) {
            if (ad[j][4] === orderId) activeSheet.deleteRow(j+1);
          }
        }
        // יצירה מחדש
        const orderData = {
          customerName: data[i][2],
          products: products,
          residenceType: data[i][7],
          isCredit: data[i][8] === 'זיכוי'
        };
        if (!orderData.isCredit) createActiveItems(orderData, orderId);
        return { success: true, message: 'הזמנה עודכנה בהצלחה' };
      }
    }
    return { success: false, message: 'הזמנה לא נמצאה: ' + orderId };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function cancelOrder(orderId) {
  try {
    const ordersSheet = getSheet('סיכום הזמנות');
    if (!ordersSheet) return { success: false, message: 'גיליון הזמנות לא נמצא' };
    const data = ordersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === orderId) {
        ordersSheet.getRange(i+1, 7).setValue('cancelled');
        const activeSheet = getSheet('פריטים פעילים');
        if (activeSheet) {
          const ad = activeSheet.getDataRange().getValues();
          for (let j = 1; j < ad.length; j++) {
            if (ad[j][4] === orderId) activeSheet.getRange(j+1, 7).setValue('cancelled');
          }
        }
        return { success: true, message: 'הזמנה בוטלה' };
      }
    }
    return { success: false, message: 'הזמנה לא נמצאה: ' + orderId };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function fmtCellTime(val) {
  // Google Sheets may return time cells as Date objects — format to HH:mm
  if (!val && val !== 0) return '';
  if (isDate(val)) return Utilities.formatDate(val, 'Asia/Jerusalem', 'HH:mm');
  const s = String(val);
  // Already HH:mm
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  // Extract HH:mm from a longer string
  const m = s.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : s;
}

function getActiveItems(limit) {
  limit = limit || 100;
  try {
    const activeSheet = getSheet('פריטים פעילים');
    if (!activeSheet || activeSheet.getLastRow() <= 1) return getRecentOrdersFromMain(limit);
    const data = activeSheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, orders: [] };
    const items = data.slice(1).slice(-limit)
      .filter(r => r[6] !== 'cancelled')
      .map((r, idx) => ({
        date: isDate(r[0]) ? fmtDate(r[0]) : (r[0] ? r[0].toString() : ''),
        time: fmtCellTime(r[1]),
        customerName: r[2] || '',
        products: r[3] || '',
        originalOrderId: r[4] || '',
        orderId: r[5] || 'temp-' + idx,
        status: r[6] || 'pending'
      }));
    return { success: true, orders: items };
  } catch (e) {
    return { success: false, message: e.toString(), orders: [] };
  }
}

function getRecentOrdersFromMain(limit) {
  limit = limit || 100;
  try {
    const sheet = getSheet('סיכום הזמנות');
    if (!sheet) return { success: false, message: 'גיליון לא נמצא', orders: [] };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, orders: [] };
    const orders = data.slice(1).slice(-limit).map((r, idx) => ({
      date: isDate(r[0]) ? fmtDate(r[0]) : (r[0] ? r[0].toString() : ''),
      time: fmtCellTime(r[1]),
      customerName: r[2] || '',
      products: r[3] || '',
      total: r[4] || 0,
      orderId: r[5] || 'temp-' + idx,
      status: r[6] || 'pending',
      residenceType: r[7] || '',
      orderType: r[8] || 'רגילה'
    }));
    return { success: true, orders };
  } catch (e) {
    return { success: false, message: e.toString(), orders: [] };
  }
}

function getOrdersByEvent(eventDate) {
  try {
    const sheet = getSheet('סיכום הזמנות');
    if (!sheet) return { success: false, message: 'גיליון לא נמצא', orders: [] };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, orders: [] };
    const eventDateObj = new Date(eventDate);
    const nextDay = new Date(eventDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const evStr = fmtDate(eventDateObj);
    const nxStr = fmtDate(nextDay);
    const relevant = [];
    data.slice(1).forEach((r, idx) => {
      const d = isDate(r[0]) ? fmtDate(r[0]) : (r[0] ? r[0].toString() : '');
      const t = fmtCellTime(r[1]);
      if (d === evStr) { relevant.push(rowToOrder(r, idx)); return; }
      if (d === nxStr) {
        const m = t.match(/(\d{1,2}):/);
        if (m && parseInt(m[1]) < 6) relevant.push(rowToOrder(r, idx));
      }
    });
    return { success: true, orders: relevant };
  } catch (e) {
    return { success: false, message: e.toString(), orders: [] };
  }
}

function rowToOrder(r, idx) {
  return {
    date: isDate(r[0]) ? fmtDate(r[0]) : (r[0] ? r[0].toString() : ''),
    time: fmtCellTime(r[1]),
    customerName: r[2] || '',
    products: r[3] || '',
    total: r[4] || 0,
    orderId: r[5] || 'temp-' + idx,
    status: r[6] || 'pending',
    residenceType: r[7] || '',
    orderType: r[8] || 'רגילה'
  };
}

// ============================================================
// ACTIVE ITEMS / BUILDERS
// Schema: תאריך(0), שעה(1), שם(2), פריט(3), מזהה_מקורי(4), מזהה_פריט(5), סטטוס(6)
// ============================================================

function loadProductsCache() {
  try {
    const sheet = getSheet('מוצרים');
    if (!sheet) return [];
    return sheet.getDataRange().getValues().slice(1).map(r => ({
      name: r[0] || '',
      requiresPreparation: r[5] !== 'לא' && r[5] !== false
    }));
  } catch (e) { return []; }
}

function shouldCreateActiveItem(productStr, cache) {
  const p = productStr.trim();
  if (!p) return false;
  if (p.startsWith('הנחה')) return false;
  if (p.includes('טיפ')) return false;
  if (p.includes('זיכוי')) return false;
  if (p.includes('₪') && (p.startsWith('✱') || p.includes('סכום חופשי'))) return false;
  // שם המוצר ללא כמות
  const nameOnly = (p.match(/^(.+?)\s*(?:\(\d+\))?$/) || [])[1] || p;
  const found = cache.find(pc => pc.name === nameOnly.trim());
  return found ? found.requiresPreparation : true;
}

function createActiveItems(orderData, orderId) {
  try {
    const HEADERS = ['תאריך', 'שעה', 'שם', 'פריט', 'מזהה_מקורי', 'מזהה_פריט', 'סטטוס'];
    const activeSheet = ensureSheet('פריטים פעילים', HEADERS);
    const now = new Date();
    const date = fmtDate(now);
    const time = fmtTime(now);
    const cache = loadProductsCache();
    const products = orderData.products.split(', ');
    let idx = 0;
    products.forEach(product => {
      if (!shouldCreateActiveItem(product, cache)) return;
      const qm = product.match(/^(.+?)\s*\((\d+)\)$/);
      if (qm) {
        const name = qm[1].trim();
        const qty = parseInt(qm[2]);
        for (let i = 0; i < qty; i++) {
          activeSheet.appendRow([date, time, orderData.customerName, name, orderId, orderId + '-' + idx, 'pending']);
          idx++;
        }
      } else {
        activeSheet.appendRow([date, time, orderData.customerName, product.trim(), orderId, orderId + '-' + idx, 'pending']);
        idx++;
      }
    });
    Logger.log('נוצרו ' + idx + ' פריטים להזמנה ' + orderId);
  } catch (e) {
    Logger.log('createActiveItems error: ' + e);
  }
}

function updateItemStatus(itemId, newStatus) {
  try {
    // First try active items sheet (item-level ID in column 5, original order ID in column 4)
    const activeSheet = getSheet('פריטים פעילים');
    if (activeSheet && activeSheet.getLastRow() > 1) {
      const data = activeSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        // Match by item-level ID (col 5) OR original order ID (col 4)
        if (String(data[i][5]) === String(itemId) || String(data[i][4]) === String(itemId)) {
          activeSheet.getRange(i + 1, 7).setValue(newStatus);
          found = true;
        }
      }
      if (found) return { success: true, message: 'סטטוס עודכן' };
    }

    // Fallback: update in main orders sheet (order-level status)
    const ordersSheet = getSheet('סיכום הזמנות');
    if (ordersSheet) {
      const oData = ordersSheet.getDataRange().getValues();
      for (let i = 1; i < oData.length; i++) {
        if (String(oData[i][5]) === String(itemId)) {
          ordersSheet.getRange(i + 1, 7).setValue(newStatus);
          return { success: true, message: 'סטטוס עודכן בהזמנה' };
        }
      }
    }

    return { success: false, message: 'פריט לא נמצא: ' + itemId };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================================
// INVENTORY
// Schema: שם מוצר(0), כמות(1), threshold(2), עדכון אחרון(3), מלאי נדרש(4), הערות(5)
// ============================================================

const INV_HEADERS = ['שם מוצר', 'כמות', 'threshold', 'עדכון אחרון', 'מלאי נדרש', 'הערות'];

function getInventory() {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const data = sheet.getDataRange().getValues();
    // בנה מפת אימוג'י מגיליון מוצרים
    const emojiMap = {};
    const pSheet = getSheet('מוצרים');
    if (pSheet) {
      pSheet.getDataRange().getValues().slice(1).forEach(r => { emojiMap[r[0]] = r[4] || '📦'; });
    }
    if (data.length <= 1) return { success: true, inventory: [] };
    const inventory = data.slice(1).map(r => ({
      name: r[0] || '',
      stock: parseInt(r[1]) || 0,
      threshold: parseInt(r[2]) || 5,
      lastUpdated: r[3] ? r[3].toString() : '',
      requiredStock: parseInt(r[4]) || 0,
      notes: r[5] ? r[5].toString() : '',
      emoji: emojiMap[r[0]] || '📦'
    }));
    return { success: true, inventory };
  } catch (e) {
    return { success: false, message: e.toString(), inventory: [] };
  }
}

function getShoppingList() {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, items: [] };
    const items = [];
    data.slice(1).forEach(r => {
      const name = r[0] || '';
      const stock = parseInt(r[1]) || 0;
      const required = parseInt(r[4]) || 0;
      const toBuy = required - stock;
      if (name && toBuy > 0) {
        items.push({
          name,
          stock,
          requiredStock: required,
          toBuy,
          notes: r[5] ? r[5].toString() : ''
        });
      }
    });
    return { success: true, items };
  } catch (e) {
    return { success: false, message: e.toString(), items: [] };
  }
}

function updateStock(productName, delta, reason) {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const data = sheet.getDataRange().getValues();
    const now = fmtDate(new Date()) + ' ' + fmtTime(new Date());
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === productName) {
        const cur = parseInt(data[i][1]) || 0;
        const next = Math.max(0, cur + parseInt(delta));
        sheet.getRange(i+1, 2).setValue(next);
        sheet.getRange(i+1, 4).setValue(now);
        Logger.log('מלאי: ' + productName + ' ' + cur + '→' + next + ' (' + (reason||'') + ')');
        return { success: true, message: 'מלאי עודכן', newStock: next };
      }
    }
    // מוצר חדש במלאי
    const initial = Math.max(0, parseInt(delta) || 0);
    sheet.appendRow([productName, initial, 5, now, 0, '']);
    return { success: true, message: 'מוצר נוסף למלאי', newStock: initial };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updateRequiredStock(productName, requiredStock, notes) {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const data = sheet.getDataRange().getValues();
    const now = fmtDate(new Date()) + ' ' + fmtTime(new Date());
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === productName) {
        sheet.getRange(i+1, 5).setValue(parseInt(requiredStock) || 0);
        if (notes !== undefined) sheet.getRange(i+1, 6).setValue(notes);
        return { success: true, message: 'מלאי נדרש עודכן' };
      }
    }
    // מוצר חדש — צור שורה עם המלאי הנדרש
    sheet.appendRow([productName, 0, 5, now, parseInt(requiredStock) || 0, notes || '']);
    return { success: true, message: 'מוצר נוסף למלאי' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// Seed inventory from initial CSV data
function seedInventory() {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const existing = sheet.getDataRange().getValues();
    const existingNames = new Set(existing.slice(1).map(r => r[0]));
    const now = fmtDate(new Date()) + ' ' + fmtTime(new Date());
    const seed = [
      ['וויסקי לקוקטטילים (גראנטס)', 3, 5, now, 3, 'וויסקי יחסית זול (גראנטס)'],
      ['וויסקי סבבה', 2, 1, now, 1, 'גלנמורנג\'י/מנקי שולדרס/משהו טוב במחיר סבבה'],
      ['רום (בקרדי)', 0, 5, now, 2, ''],
      ['ערק', 0, 5, now, 2, ''],
      ['יין אדום', 1, 1, now, 1, 'קטגוריה של 50 ש"ח'],
      ['יין לבן', 1, 1, now, 1, 'קטגוריה של 50 ש"ח'],
      ['יין אדום לסיידר', 0, 2, now, 4, 'היינות האדומים של טפרברג 2 ב-65 ש"ח'],
      ['קווה', 0, 1, now, 2, ''],
      ['אפרול', 1, 1, now, 1, ''],
      ['וודקה', 2, 1, now, 1, ''],
      ['מונין ליצ\'י', 1, 1, now, 1, 'קונים בפיופ'],
      ['מונין אננס', 1, 1, now, 1, 'קונים בפיופ'],
      ['מונין פסיפלורה', 1, 1, now, 1, 'קונים בפיופ'],
      ['בירות', 60, 20, now, 50, 'לדאוג ל-50 בירות, אפשר לזרום עם המגוון. קונים 1/3. לפחות 18 גולדסטאר'],
      ['מיץ לימון טבעי סחוט', 10, 3, now, 12, 'חשוב לשים לב שקונים את הטבעי והטובים אחרת זה מבאס (בד"כ בבקבוקי זכוכית)'],
      ['מיץ תפוזים סחוט טבעי', 3, 2, now, 4, '4 ליטר לערב, חשוב סחוט משהו טוב'],
      ['לימונדה', 3, 2, now, 2, ''],
      ['סודה', 0, 2, now, 3, ''],
      ['סיידר תפוחים טבעי', 2, 1, now, 1, 'פחית גדולה של סיידר'],
      ['רדבול', 2, 2, now, 2, ''],
      ['עלי נענע טריים', 0, 1, now, 2, ''],
      ['שק לימונים', 5, 5, now, 10, 'לפחות 10 לימונים'],
      ['תפוז', 7, 1, now, 1, 'תפוז 1'],
      ['תפוחים', 8, 3, now, 5, 'אפשר גם 2 אגסים'],
      ['קרח', 6, 3, now, 8, 'לדבר עם איציק, אם הוא מביא אין צורך לקנות'],
      ['סוכר', 1, 1, now, 1, 'בעיקר לשים לב שלא נגמר לפעם הבאה'],
      ['צ\'ילי גרוס', 1, 1, now, 1, ''],
      ['פלפל צ\'ילי', 1, 1, now, 1, ''],
      ['כוכבי אניס', 1, 1, now, 1, 'שקית'],
      ['מקלות קינמון', 1, 1, now, 1, 'שקית של מקלות'],
      ['ציפורן תבלין', 1, 1, now, 1, 'במידה ומכינים סיידר'],
      ['קשים שחורים', 300, 50, now, 100, 'לשים כל הזמן לב שיש קשים. ניתן לקנות במקסטוק/פיופ'],
      ['זיתים', 5, 2, now, 6, 'חבילות של שימורים טובים!'],
      ['נאצ\'וס', 11, 5, now, 10, 'להזמין דרך זוהר'],
      ['גומי', 0, 1, now, 2, 'שיהיה 2 חבילות'],
      ['סבון כלים', 3, 1, now, 1, ''],
      ['נייר סופר', 3, 1, now, 1, ''],
      ['דלי מגבונים', 2, 1, now, 1, ''],
    ];
    let added = 0;
    seed.forEach(row => {
      if (!existingNames.has(row[0])) {
        sheet.appendRow(row);
        added++;
      }
    });
    return { success: true, message: 'נוספו ' + added + ' פריטים למלאי' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// Seed initial beer sub-type breakdown (from Excel side table)
function seedBeerTypes() {
  try {
    const sheet = ensureSheet('מלאי', INV_HEADERS);
    const existing = sheet.getDataRange().getValues();
    const existingNames = new Set(existing.slice(1).map(r => r[0]));
    const now = fmtDate(new Date()) + ' ' + fmtTime(new Date());
    const beerTypes = [
      ['בירה גולדסטאר', 34, 0, now, 0, ''],
      ['בירה לף',        4, 0, now, 0, ''],
      ['בירה קורונה',   13, 0, now, 0, ''],
      ['בירה מכבי 7.9',  8, 0, now, 0, ''],
      ['בירה סטלה',      7, 0, now, 0, ''],
    ];
    let added = 0;
    beerTypes.forEach(row => {
      if (!existingNames.has(row[0])) {
        sheet.appendRow(row);
        added++;
      }
    });
    // Reset "בירות" stock to 0 — sub-types now track the stock
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === 'בירות') {
        sheet.getRange(i + 1, 2).setValue(0);
        break;
      }
    }
    return { success: true, message: 'נוספו ' + added + ' סוגי בירה למלאי — מלאי "בירות" אופס' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================================
// MAINTENANCE
// ============================================================

function cleanOldActiveItems() {
  try {
    const sheet = getSheet('פריטים פעילים');
    if (!sheet || sheet.getLastRow() <= 1) return;
    const data = sheet.getDataRange().getValues();
    const today = fmtDate(new Date());
    for (let i = data.length - 1; i >= 1; i--) {
      const d = data[i][0] ? data[i][0].toString() : '';
      if (d && d !== today) sheet.deleteRow(i+1);
    }
    Logger.log('ניקוי פריטים ישנים הושלם');
  } catch (e) {
    Logger.log('cleanOldActiveItems error: ' + e);
  }
}

function dailyCleanup() {
  cleanOldActiveItems();
}

// Time-based trigger: run this every 10 minutes to prevent cold starts
function keepWarm() {
  Logger.log('keep-warm ' + new Date().toISOString());
}

// ============================================================
// HTTP HANDLER
// ============================================================

function doGet(e) {
  return doPost(e);
}

function doPost(e) {
  try {
    if (!e || !e.parameter) return jsonResponse({ success: false, message: 'אין פרמטרים' });
    const action = e.parameter.action;
    const p = e.parameter;

    switch (action) {

      case 'ping':
        return jsonResponse({ success: true });

      // ── Products ──────────────────────────────────────────
      case 'getProducts':
        return jsonResponse(getProducts());

      case 'getAllProductsForReports':
        return jsonResponse(getAllProductsForReports());

      case 'addProduct':
        return jsonResponse(addProduct({ name: p.name, price: p.price, emoji: p.emoji, category: p.category, requiresPreparation: p.requiresPreparation }));

      case 'updateProduct':
        return jsonResponse(updateProduct({ name: p.name, price: p.price, emoji: p.emoji, category: p.category, requiresPreparation: p.requiresPreparation, active: p.active }));

      case 'deleteProduct':
        return jsonResponse(deleteProduct(p.name));

      // ── Residents ─────────────────────────────────────────
      case 'getResidents':
        return jsonResponse(getResidents());

      case 'getAllResidents':
        return jsonResponse(getAllResidents());

      case 'addResident':
        return jsonResponse(addResident({ fullName: p.fullName, nickname: p.nickname, residenceType: p.residenceType, notes: p.notes }));

      case 'updateResident':
        return jsonResponse(updateResident({ fullName: p.fullName, nickname: p.nickname, residenceType: p.residenceType, active: p.active, notes: p.notes }));

      // ── Orders ────────────────────────────────────────────
      case 'addOrder':
        return jsonResponse(addOrder({
          customerName: p.customerName,
          products: p.products,
          total: parseInt(p.total),
          residenceType: p.residenceType || '',
          isCredit: p.isCredit === 'true'
        }));

      case 'updateOrder':
        return jsonResponse(updateOrder(p.orderId, p.products, parseInt(p.total)));

      case 'cancelOrder':
        return jsonResponse(cancelOrder(p.orderId));

      case 'getRecentOrders':
        return jsonResponse(getActiveItems(parseInt(p.limit) || 100));

      case 'getRecentOrdersFromMain':
        return jsonResponse(getRecentOrdersFromMain(parseInt(p.limit) || 100));

      case 'getOrdersByEvent':
        if (!p.eventDate) return jsonResponse({ success: false, message: 'לא צוין תאריך' });
        return jsonResponse(getOrdersByEvent(p.eventDate));

      case 'updateStatus':
        return jsonResponse(updateItemStatus(p.orderId, p.newStatus));

      // ── Inventory ─────────────────────────────────────────
      case 'getInventory':
        return jsonResponse(getInventory());

      case 'updateStock':
        return jsonResponse(updateStock(p.productName, parseInt(p.delta) || 0, p.reason || ''));

      case 'getShoppingList':
        return jsonResponse(getShoppingList());

      case 'updateRequiredStock':
        return jsonResponse(updateRequiredStock(p.productName, p.requiredStock, p.notes));

      case 'seedInventory':
        return jsonResponse(seedInventory());

      case 'seedBeerTypes':
        return jsonResponse(seedBeerTypes());

      default:
        return jsonResponse({ success: false, message: 'פעולה לא מוכרת: ' + action });
    }
  } catch (e) {
    Logger.log('doPost error: ' + e);
    return jsonResponse({ success: false, message: e.toString() });
  }
}
