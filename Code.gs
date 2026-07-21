// ============================================================
//  DELUXE SALÓN 2 · Google Apps Script v4
//  Con soporte de bloqueos manuales de horario
// ============================================================
const CALENDAR_ID = 'primary';
const OPEN_START   = 9 * 60;
const OPEN_END     = 19 * 60 + 30;
const OWNER_EMAIL  = 'TU_CORREO@gmail.com'; // ← reemplaza por el Gmail donde quieres recibir el aviso

function getPaymentSheet() {
  const files = DriveApp.getFilesByName('Deluxe Salón 2 · Pagos');
  let ss;
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create('Deluxe Salón 2 · Pagos');
    const sheet = ss.getActiveSheet();
    sheet.setName('Pagos');
    sheet.appendRow(['ID','Fecha','Hora','StaffId','Profesional','Cliente','Teléfono','Servicio','Valor','Método de pago','Estado','Registrado']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,12).setBackground('#b8912a').setFontColor('#ffffff').setFontWeight('bold');
  }
  return ss.getSheetByName('Pagos') || ss.getActiveSheet();
}

function doGet(e) {
  const out = (data) =>
    ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  try {
    const action = e.parameter.action || '';

    // ── 1. Disponibilidad ────────────────────────────────────
    if (action === 'availability') {
      const busy = getBusySlots(e.parameter.staffId, e.parameter.date);
      return out({ ok: true, busy });
    }

    // ── 2. Reservar cita ────────────────────────────────────
    if (action === 'book') {
      const { staffId, staffName, date, startTime, duration,
              service, category, clientName, clientPhone, price, paymentMethod } = e.parameter;
      if (!staffId || !date || !startTime || !service || !clientName)
        return out({ ok: false, error: 'Faltan datos' });

      const busy = getBusySlots(staffId, date);
      const startMin = timeToMin(startTime);
      if (!isSlotFree(busy, startMin, parseInt(duration)))
        return out({ ok: false, error: 'SLOT_TAKEN' });

      const [y,m,d] = date.split('-').map(Number);
      const [h,min] = startTime.split(':').map(Number);
      const startDate = new Date(y, m-1, d, h, min, 0);
      const endDate   = new Date(startDate.getTime() + parseInt(duration) * 60000);

      const title = `💅 ${service} · ${clientName}`;
      const desc  = [
        `Profesional: ${staffName}`,
        `Servicio: ${service}`,
        `Categoría: ${category}`,
        `Cliente: ${clientName}`,
        `Teléfono: ${clientPhone || ''}`,
        `Valor: ${price}`,
        `Método de pago: ${paymentMethod || 'no especificado'}`,
        `Staff ID: ${staffId}`,
        `Estado: pendiente`
      ].join('\n');

      const cal = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
      const event = cal.createEvent(title, startDate, endDate, { description: desc });
      event.addPopupReminder(0); // recordatorio en el momento en que empieza la cita

      // Aviso inmediato al celular (llega como notificación push de Gmail
      // apenas se agenda, sin esperar al recordatorio del evento)
      try {
        if (OWNER_EMAIL && OWNER_EMAIL.indexOf('@') > -1) {
          MailApp.sendEmail({
            to: OWNER_EMAIL,
            subject: `📅 Nueva cita: ${service} · ${clientName}`,
            body: `Se agendó una nueva cita.\n\n` +
                  `Servicio: ${service}\n` +
                  `Cliente: ${clientName}\n` +
                  `Teléfono: ${clientPhone || 'no especificado'}\n` +
                  `Profesional: ${staffName}\n` +
                  `Fecha: ${date}\n` +
                  `Hora: ${startTime}\n` +
                  `Valor: ${price}\n` +
                  `Método de pago: ${paymentMethod || 'no especificado'}`
          });
        }
      } catch (mailErr) {
        // si falla el correo no debe romper la reserva
      }

      const sheet = getPaymentSheet();
      sheet.appendRow([
        Date.now().toString(36), date, startTime, staffId, staffName,
        clientName, clientPhone || '', service, parseInt(price || 0),
        paymentMethod || '', 'pendiente', new Date().toISOString()
      ]);

      return out({ ok: true });
    }

    // ── 3. Bloquear horario manualmente ─────────────────────
    if (action === 'blockSlot') {
      const { staffId, staffName, date, startTime, endTime, reason } = e.parameter;
      if (!staffId || !date || !startTime || !endTime)
        return out({ ok: false, error: 'Faltan datos para el bloqueo' });

      const [y,m,d] = date.split('-').map(Number);
      const [hs,ms] = startTime.split(':').map(Number);
      const [he,me] = endTime.split(':').map(Number);
      const startDate = new Date(y, m-1, d, hs, ms, 0);
      const endDate   = new Date(y, m-1, d, he, me, 0);

      const title = `🚫 BLOQUEADO · ${staffName}`;
      const desc  = [
        `Staff ID: ${staffId}`,
        `Tipo: BLOQUEO`,
        `Motivo: ${reason || 'Sin especificar'}`,
        `Profesional: ${staffName}`
      ].join('\n');

      const cal = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
      const event = cal.createEvent(title, startDate, endDate, { description: desc });
      return out({ ok: true, eventId: event.getId() });
    }

    // ── 4. Eliminar bloqueo ─────────────────────────────────
    if (action === 'removeBlock') {
      const { staffId, date, startTime } = e.parameter;
      const [y,m,d] = date.split('-').map(Number);
      const cal = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
      const events = cal.getEvents(new Date(y,m-1,d,0,0,0), new Date(y,m-1,d,23,59,59));
      let removed = false;
      events.forEach(ev => {
        const desc = ev.getDescription() || '';
        if (desc.includes('Staff ID: '+staffId) && desc.includes('Tipo: BLOQUEO')) {
          const start = ev.getStartTime();
          const sMin = start.getHours()*60 + start.getMinutes();
          if (min2t(sMin) === startTime) { ev.deleteEvent(); removed = true; }
        }
      });
      return out({ ok: true, removed });
    }

    // ── 5. Actualizar estado de pago ─────────────────────────
    if (action === 'updatePayment') {
      const { staffId, date, startTime, status } = e.parameter;
      const sheet = getPaymentSheet();
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] == date && data[i][2] == startTime && data[i][3] == staffId) {
          sheet.getRange(i+1, 11).setValue(status);
          return out({ ok: true });
        }
      }
      return out({ ok: false, error: 'No encontrado' });
    }

    // ── 6. Obtener pagos ────────────────────────────────────
    if (action === 'getPayments') {
      const { from, to, staffId: sf } = e.parameter;
      const sheet = getPaymentSheet();
      const rows  = sheet.getDataRange().getValues();
      const headers = rows[0];
      const data = rows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h,i) => obj[h] = r[i]);
        return obj;
      }).filter(r => {
        if (from && r['Fecha'] < from) return false;
        if (to   && r['Fecha'] > to)   return false;
        if (sf && sf !== 'all' && r['StaffId'] !== sf) return false;
        return true;
      });
      return out({ ok: true, payments: data });
    }

    return out({ ok: false, error: 'Acción desconocida' });
  } catch(err) {
    return out({ ok: false, error: err.toString() });
  }
}

// ── Helpers ─────────────────────────────────────────────────
function getBusySlots(staffId, date) {
  if (!staffId || !date) return [];
  const [y,m,d] = date.split('-').map(Number);
  const cal = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const events = cal.getEvents(new Date(y,m-1,d,0,0,0), new Date(y,m-1,d,23,59,59));
  return events.map(ev => {
    const desc = ev.getDescription() || '';
    // Reconocer tanto citas normales como bloqueos manuales
    if (!desc.includes('Staff ID: ' + staffId)) return null;
    const start = ev.getStartTime(), end = ev.getEndTime();
    const startMin = start.getHours()*60 + start.getMinutes();
    const dur = Math.round((end - start) / 60000);
    const isBlock = desc.includes('Tipo: BLOQUEO');
    const get = key => { const m = desc.match(new RegExp(key+': (.+)')); return m ? m[1].trim() : ''; };
    return {
      startTime: min2t(startMin),
      duration: dur,
      isBlock,
      motivo: isBlock ? get('Motivo') : null,
      service: isBlock ? '🚫 Horario bloqueado' : get('Servicio'),
      clientName: isBlock ? get('Motivo') : get('Cliente'),
      clientPhone: isBlock ? '' : get('Teléfono'),
      price: isBlock ? 0 : parseInt(get('Valor') || 0),
      paymentMethod: isBlock ? '' : get('Método de pago'),
    };
  }).filter(Boolean);
}

function timeToMin(t) { const[h,m]=t.split(':').map(Number); return h*60+m; }
function min2t(m) { return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
function isSlotFree(busy, start, dur) {
  const end = start + dur;
  return !busy.some(b => { const bs = timeToMin(b.startTime), be = bs+b.duration; return start<be && bs<end; });
}
