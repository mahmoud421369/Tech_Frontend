import React, {
  useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiX, FiSearch, FiRefreshCw,
  FiList, FiGrid, FiCheck, FiTrendingUp, FiNavigation, FiShoppingBag, FiMapPin, FiPhone,
  FiAlertCircle, FiCopy,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { UI3D_CSS, Defs3D } from '../user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../user/UiExtras';

export { Defs3D, Toaster };

const EN = {
  'lang.label': 'Language',
  'refresh': 'Refresh',
  'lastUpdated': 'Last updated: {time}',
  'tabs.assignment': 'Assignment status',
  'tab.all': 'All',
  'tab.pending': 'Pending',
  'tab.assigned': 'Assigned',
  'tab.progress': 'In progress',
  'tab.unassigned': 'Unassigned',
  'search.label': 'Search {items}',
  'search.clear': 'Clear search',
  'search.assign': 'Search ID, customer, phone, shop or city',
  'search.reassign': 'Search ID, customer, shop, agent or status',
  'rows': '{n} rows',
  'perPage': '{items} per page',
  'view.group': 'View',
  'view.table': 'Table',
  'view.cards': 'Cards',
  'page.nav': 'Pagination',
  'page.prev': 'Previous page',
  'page.next': 'Next page',
  'page.go': 'Go to page {n}',
  'showing': 'Showing {from}–{to} of {total} {items}',
  'col.id': 'ID',
  'col.customer': 'Customer',
  'col.route': 'Route',
  'col.waiting': 'Waiting',
  'col.status': 'Status',
  'col.actions': 'Actions',
  'col.date': 'Date',
  'col.agent': 'Agent',
  'customer': 'Customer',
  'customer.unknown': 'Unknown customer',
  'phone.none': 'No phone number',
  'phone.noneShort': 'No phone',
  'shop': 'Shop',
  'addr.none': 'Address not provided',
  'notProvided': 'Not provided',
  'stop.pickupShop': 'Pickup · Shop',
  'stop.dropCustomer': 'Drop-off · Customer',
  'stop.shop': 'Shop',
  'stop.customerAddress': 'Customer address',
  'maps.pickup': 'Open pickup location in maps',
  'maps.drop': 'Open drop-off location in maps',
  'call': 'Call {name}',
  'copy.aria': 'Copy {item} ID {id}',
  'copy.short': 'Copy {item} ID',
  'copy.title': 'Copy ID',
  'copied': 'ID copied to clipboard',
  'copyFail': 'Allow clipboard access in your browser.',
  'copyFail.title': 'Could not copy',
  'select.item': 'Select {item} {id}',
  'select.all': 'Select all pending on this page',
  'waiting': 'Waiting {time}',
  'time.now': 'Just now',
  'time.m': '{n}m',
  'time.hm': '{h}h {m}m',
  'time.dh': '{d}d {h}h',
  'details': 'Details',
  'details.aria': 'View details for {item} {id}',
  'assign': 'Assign',
  'reassign': 'Reassign',
  'assign.aria': 'Assign {item} {id}',
  'reassign.aria': 'Reassign {item} {id}',
  'agent.none': 'No agent yet',
  'st.PENDING': 'Pending',
  'st.SUBMITTED': 'Submitted',
  'st.QUOTE_PENDING': 'Quote pending',
  'st.PENDING_PICKUP': 'Pending pickup',
  'st.ASSIGNED': 'Assigned',
  'st.IN_TRANSIT': 'In transit',
  'st.IN_PROGRESS': 'In progress',
  'st.SHIPPED': 'Shipped',
  'st.COMPLETED': 'Completed',
  'st.CANCELLED': 'Cancelled',
  'order.one': 'order',
  'order.many': 'orders',
  'repair.one': 'repair',
  'repair.many': 'repairs',
  'stat.total': 'Total {items}',
  'stat.total.queue': 'Everything in the queue',
  'stat.total.log': 'Everything in the log',
  'stat.pending': 'Pending',
  'stat.pending.desc': 'Waiting for an agent',
  'stat.assigned': 'Assigned',
  'stat.assigned.desc': 'Already with an agent',
  'stat.progress': 'In progress',
  'stat.progress.desc': 'With a delivery agent',
  'stat.unassigned': 'Unassigned',
  'stat.unassigned.desc': 'Waiting for an agent',
  'stat.valueDesc': 'Across all {items}',
  'price.order': 'Order value',
  'price.est': 'Est. price',
  'value.total': 'Total value',
  'value.estRevenue': 'Est. revenue',
  'eyebrow.dispatch': 'Dispatch',
  'eyebrow.logistics': 'Logistics',
  'eyebrow.reassign': 'Reassign',
  'orders.assign.title': 'Orders Dispatch',
  'orders.assign.subtitle': 'Assign pending orders to delivery agents',
  'orders.assign.doc': 'Assigner - Orders | Tech Restore',
  'repairs.assign.title': 'Repairs Logistics',
  'repairs.assign.subtitle': 'Coordinate pickup and delivery for repair requests',
  'repairs.assign.doc': 'Assigner - Repairs | Tech Restore',
  'orders.reassign.title': 'Reassign Orders',
  'orders.reassign.subtitle': 'Transfer orders between agents or fix assignment errors',
  'orders.reassign.doc': 'Assigner - Reassign Orders | Tech Restore',
  'repairs.reassign.title': 'Reassign Repairs',
  'repairs.reassign.subtitle': 'Manage and transfer repair logistics between agents',
  'repairs.reassign.doc': 'Assigner - Reassign Repairs | Tech Restore',
  'err.title': "Couldn't load {items}",
  'err.sub': 'Check your connection and try again.',
  'err.retry': 'Try again',
  'empty.queue.title': 'Queue is empty',
  'empty.queue.msg': 'No {items} are waiting. New ones appear here automatically.',
  'empty.queue.action': 'Refresh queue',
  'empty.none.title': 'No {items} found',
  'empty.none.msg': 'Nothing to reassign right now. New {items} appear here automatically.',
  'empty.none.action': 'Refresh',
  'empty.match.title': 'No matching {items}',
  'empty.match.assign': 'Try a different ID, customer, phone, shop or city, or switch tab.',
  'empty.match.reassign': 'Try a different ID, customer, shop, agent or status, or switch tab.',
  'empty.match.action': 'Clear search',
  'toast.denied.title': 'Access denied',
  'toast.denied.text': 'Assigner accounts only.',
  'toast.loadFail': 'Failed to load {items}',
  'toast.partial': 'Some {items} could not be loaded right now.',
  'toast.agentsDown.assign': 'Agents unavailable. Assigning may not work until they load.',
  'toast.agentsDown.reassign': 'Agents unavailable. Reassigning may not work until they load.',
  'toast.agentOffline': 'This agent is unavailable. Pick another one.',
  'toast.assigned.one': '{Item} assigned',
  'toast.assigned.many': '{count} {items} assigned',
  'toast.assigned.partial': '{done} assigned, {failed} failed',
  'toast.assigned.fail': 'Assignment failed',
  'toast.transferred': '{Item} transferred',
  'toast.notFound': '{Item} or agent not found',
  'toast.reassign.fail': 'Reassignment failed',
  'confirm.title': 'Assign {count} {items}?',
  'confirm.text': 'All of them will go to {agent}.',
  'confirm.ok': 'Assign now',
  'confirm.cancel': 'Cancel',
  'confirm.thisAgent': 'this agent',
  'selection.selected': '{count} {items} selected',
  'selection.clear': 'Clear',
  'selection.assign': 'Assign to agent',
  'drawer.assign': 'Assign {item}',
  'drawer.reassign': 'Reassign {item}',
  'drawer.details': '{Item} details',
  'drawer.bulk': 'Assign {count} {items}',
  'drawer.bulkSel': '{count} pending {items} selected',
  'drawer.bulkSum': '{label} total: {price}. They will all go to the same agent.',
  'drawer.close': 'Close',
  'drawer.cancel': 'Cancel',
  'drawer.receivedOn': 'Received on',
  'drawer.recordedOn': 'Recorded on',
  'drawer.shopPhone': 'Shop phone',
  'drawer.assignedBy': 'Assigned by',
  'drawer.currentAgent': 'Current agent',
  'drawer.notAssigned': 'Not assigned yet',
  'drawer.notes.assign': 'Instructions for the agent',
  'drawer.notes.reassign': 'Reason for the transfer',
  'drawer.notes.ph': 'Optional notes...',
  'drawer.choose': 'Choose an agent',
  'drawer.chooseNew': 'Choose the new agent',
  'drawer.leastBusy': 'Least busy first',
  'drawer.noAgents': 'No delivery agents available.',
  'drawer.noOther': 'No other delivery agents available.',
  'drawer.noMatch': 'No agents match your search.',
  'drawer.pick': 'Pick an agent',
  'drawer.assigning': 'Assigning...',
  'drawer.saving': 'Saving...',
  'drawer.assignTo': 'Assign to {name}',
  'drawer.transferTo': 'Transfer to {name}',
  'drawer.agentWord': 'agent',
  'agent.search': 'Search agents',
  'agent.group': 'Delivery agents',
  'agent.unnamed': 'Unnamed agent',
  'agent.task.one': '{n} active task',
  'agent.task.many': '{n} active tasks',
  'agent.busy': 'Busy',
  'agent.free': 'Free',
  'agent.unavailable': 'Unavailable',
  'loading': 'Loading {items}',
};

const AR = {
  'lang.label': 'اللغة',
  'refresh': 'تحديث',
  'lastUpdated': 'آخر تحديث: {time}',
  'tabs.assignment': 'حالة التعيين',
  'tab.all': 'الكل',
  'tab.pending': 'قيد الانتظار',
  'tab.assigned': 'تم تعيينها',
  'tab.progress': 'قيد التنفيذ',
  'tab.unassigned': 'غير معيّنة',
  'search.label': 'ابحث في {items}',
  'search.clear': 'مسح البحث',
  'search.assign': 'ابحث بالرقم أو العميل أو الهاتف أو المتجر أو المدينة',
  'search.reassign': 'ابحث بالرقم أو العميل أو المتجر أو المندوب أو الحالة',
  'rows': '{n} صفوف',
  'perPage': '{items} في الصفحة',
  'view.group': 'العرض',
  'view.table': 'جدول',
  'view.cards': 'بطاقات',
  'page.nav': 'التنقل بين الصفحات',
  'page.prev': 'الصفحة السابقة',
  'page.next': 'الصفحة التالية',
  'page.go': 'اذهب إلى الصفحة {n}',
  'showing': 'عرض {from}–{to} من {total} {items}',
  'col.id': 'الرقم',
  'col.customer': 'العميل',
  'col.route': 'المسار',
  'col.waiting': 'الانتظار',
  'col.status': 'الحالة',
  'col.actions': 'الإجراءات',
  'col.date': 'التاريخ',
  'col.agent': 'المندوب',
  'customer': 'العميل',
  'customer.unknown': 'عميل غير معروف',
  'phone.none': 'لا يوجد رقم هاتف',
  'phone.noneShort': 'بدون هاتف',
  'shop': 'المتجر',
  'addr.none': 'العنوان غير متوفر',
  'notProvided': 'غير متوفر',
  'stop.pickupShop': 'الاستلام · المتجر',
  'stop.dropCustomer': 'التسليم · العميل',
  'stop.shop': 'المتجر',
  'stop.customerAddress': 'عنوان العميل',
  'maps.pickup': 'افتح موقع الاستلام في الخرائط',
  'maps.drop': 'افتح موقع التسليم في الخرائط',
  'call': 'اتصل بـ {name}',
  'copy.aria': 'انسخ رقم {item} {id}',
  'copy.short': 'انسخ رقم {item}',
  'copy.title': 'انسخ الرقم',
  'copied': 'تم نسخ الرقم',
  'copyFail': 'اسمح بالوصول إلى الحافظة من المتصفح.',
  'copyFail.title': 'تعذّر النسخ',
  'select.item': 'تحديد {item} {id}',
  'select.all': 'تحديد كل المعلّق في هذه الصفحة',
  'waiting': 'في الانتظار {time}',
  'time.now': 'الآن',
  'time.m': '{n} د',
  'time.hm': '{h} س {m} د',
  'time.dh': '{d} ي {h} س',
  'details': 'التفاصيل',
  'details.aria': 'عرض تفاصيل {item} {id}',
  'assign': 'تعيين',
  'reassign': 'إعادة تعيين',
  'assign.aria': 'تعيين {item} {id}',
  'reassign.aria': 'إعادة تعيين {item} {id}',
  'agent.none': 'لا يوجد مندوب بعد',
  'st.PENDING': 'قيد الانتظار',
  'st.SUBMITTED': 'تم الإرسال',
  'st.QUOTE_PENDING': 'بانتظار التسعير',
  'st.PENDING_PICKUP': 'بانتظار الاستلام',
  'st.ASSIGNED': 'تم التعيين',
  'st.IN_TRANSIT': 'في الطريق',
  'st.IN_PROGRESS': 'قيد التنفيذ',
  'st.SHIPPED': 'تم الشحن',
  'st.COMPLETED': 'مكتمل',
  'st.CANCELLED': 'ملغي',
  'order.one': 'طلب',
  'order.many': 'طلبات',
  'repair.one': 'طلب إصلاح',
  'repair.many': 'طلبات الإصلاح',
  'stat.total': 'إجمالي {items}',
  'stat.total.queue': 'كل ما في قائمة الانتظار',
  'stat.total.log': 'كل ما في السجل',
  'stat.pending': 'قيد الانتظار',
  'stat.pending.desc': 'بانتظار مندوب',
  'stat.assigned': 'تم تعيينها',
  'stat.assigned.desc': 'لدى مندوب بالفعل',
  'stat.progress': 'قيد التنفيذ',
  'stat.progress.desc': 'لدى مندوب توصيل',
  'stat.unassigned': 'غير معيّنة',
  'stat.unassigned.desc': 'بانتظار مندوب',
  'stat.valueDesc': 'عبر كل {items}',
  'price.order': 'قيمة الطلب',
  'price.est': 'السعر التقديري',
  'value.total': 'إجمالي القيمة',
  'value.estRevenue': 'الإيرادات التقديرية',
  'eyebrow.dispatch': 'التوزيع',
  'eyebrow.logistics': 'اللوجستيات',
  'eyebrow.reassign': 'إعادة التعيين',
  'orders.assign.title': 'توزيع الطلبات',
  'orders.assign.subtitle': 'عيّن الطلبات المعلّقة لمناديب التوصيل',
  'orders.assign.doc': 'الموزِّع - الطلبات | Tech Restore',
  'repairs.assign.title': 'لوجستيات الإصلاح',
  'repairs.assign.subtitle': 'نسّق استلام وتسليم طلبات الإصلاح',
  'repairs.assign.doc': 'الموزِّع - الإصلاحات | Tech Restore',
  'orders.reassign.title': 'إعادة تعيين الطلبات',
  'orders.reassign.subtitle': 'انقل الطلبات بين المناديب أو صحّح أخطاء التعيين',
  'orders.reassign.doc': 'الموزِّع - إعادة تعيين الطلبات | Tech Restore',
  'repairs.reassign.title': 'إعادة تعيين الإصلاحات',
  'repairs.reassign.subtitle': 'أدر لوجستيات الإصلاح وانقلها بين المناديب',
  'repairs.reassign.doc': 'الموزِّع - إعادة تعيين الإصلاحات | Tech Restore',
  'err.title': 'تعذّر تحميل {items}',
  'err.sub': 'تحقق من اتصالك وحاول مرة أخرى.',
  'err.retry': 'حاول مرة أخرى',
  'empty.queue.title': 'قائمة الانتظار فارغة',
  'empty.queue.msg': 'لا يوجد شيء بانتظار التعيين. ستظهر العناصر الجديدة هنا تلقائياً.',
  'empty.queue.action': 'تحديث القائمة',
  'empty.none.title': 'لا توجد نتائج',
  'empty.none.msg': 'لا يوجد ما يمكن إعادة تعيينه الآن. ستظهر العناصر الجديدة هنا تلقائياً.',
  'empty.none.action': 'تحديث',
  'empty.match.title': 'لا توجد نتائج مطابقة',
  'empty.match.assign': 'جرّب رقماً أو عميلاً أو هاتفاً أو متجراً أو مدينة مختلفة، أو بدّل التبويب.',
  'empty.match.reassign': 'جرّب رقماً أو عميلاً أو متجراً أو مندوباً أو حالة مختلفة، أو بدّل التبويب.',
  'empty.match.action': 'مسح البحث',
  'toast.denied.title': 'تم رفض الوصول',
  'toast.denied.text': 'هذه الصفحة لحسابات الموزِّع فقط.',
  'toast.loadFail': 'تعذّر تحميل {items}',
  'toast.partial': 'تعذّر تحميل بعض العناصر حالياً.',
  'toast.agentsDown.assign': 'المناديب غير متاحين. قد لا يعمل التعيين حتى يتم تحميلهم.',
  'toast.agentsDown.reassign': 'المناديب غير متاحين. قد لا تعمل إعادة التعيين حتى يتم تحميلهم.',
  'toast.agentOffline': 'هذا المندوب غير متاح. اختر مندوباً آخر.',
  'toast.assigned.one': 'تم تعيين {item}',
  'toast.assigned.many': 'تم تعيين {count} {items}',
  'toast.assigned.partial': 'تم تعيين {done} وفشل {failed}',
  'toast.assigned.fail': 'فشل التعيين',
  'toast.transferred': 'تم نقل {item}',
  'toast.notFound': 'لم يتم العثور على {item} أو المندوب',
  'toast.reassign.fail': 'فشلت إعادة التعيين',
  'confirm.title': 'تعيين {count} {items}؟',
  'confirm.text': 'سيتم تعيينها جميعاً إلى {agent}.',
  'confirm.ok': 'عيّن الآن',
  'confirm.cancel': 'إلغاء',
  'confirm.thisAgent': 'هذا المندوب',
  'selection.selected': 'تم تحديد {count} {items}',
  'selection.clear': 'مسح',
  'selection.assign': 'تعيين لمندوب',
  'drawer.assign': 'تعيين {item}',
  'drawer.reassign': 'إعادة تعيين {item}',
  'drawer.details': 'تفاصيل {item}',
  'drawer.bulk': 'تعيين {count} {items}',
  'drawer.bulkSel': 'تم تحديد {count} {items} معلّقة',
  'drawer.bulkSum': '{label} الإجمالية: {price}. سيتم تعيينها جميعاً لنفس المندوب.',
  'drawer.close': 'إغلاق',
  'drawer.cancel': 'إلغاء',
  'drawer.receivedOn': 'تاريخ الاستلام',
  'drawer.recordedOn': 'تاريخ التسجيل',
  'drawer.shopPhone': 'هاتف المتجر',
  'drawer.assignedBy': 'تم التعيين بواسطة',
  'drawer.currentAgent': 'المندوب الحالي',
  'drawer.notAssigned': 'لم يتم التعيين بعد',
  'drawer.notes.assign': 'تعليمات للمندوب',
  'drawer.notes.reassign': 'سبب النقل',
  'drawer.notes.ph': 'ملاحظات اختيارية...',
  'drawer.choose': 'اختر مندوباً',
  'drawer.chooseNew': 'اختر المندوب الجديد',
  'drawer.leastBusy': 'الأقل انشغالاً أولاً',
  'drawer.noAgents': 'لا يوجد مناديب توصيل متاحون.',
  'drawer.noOther': 'لا يوجد مناديب توصيل آخرون متاحون.',
  'drawer.noMatch': 'لا يوجد مناديب مطابقون للبحث.',
  'drawer.pick': 'اختر مندوباً',
  'drawer.assigning': 'جارٍ التعيين...',
  'drawer.saving': 'جارٍ الحفظ...',
  'drawer.assignTo': 'تعيين إلى {name}',
  'drawer.transferTo': 'نقل إلى {name}',
  'drawer.agentWord': 'المندوب',
  'agent.search': 'ابحث عن مندوب',
  'agent.group': 'مناديب التوصيل',
  'agent.unnamed': 'مندوب بلا اسم',
  'agent.task.one': 'مهمة نشطة واحدة',
  'agent.task.many': '{n} مهام نشطة',
  'agent.busy': 'مشغول',
  'agent.free': 'متاح',
  'agent.unavailable': 'غير متاح',
  'loading': 'جارٍ تحميل {items}',
};

const DICT = { en: EN, ar: AR };
const STORE_KEY = 'assignerLang';
const listeners = new Set();

const applyDoc = (l) => {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.lang = l;
  el.dir = l === 'ar' ? 'rtl' : 'ltr';
};

const stored = (() => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } })();
let currentLang = stored === 'ar' ? 'ar' : 'en';
if (stored) applyDoc(currentLang);

export const setLang = (l) => {
  if (l === currentLang || !DICT[l]) return;
  currentLang = l;
  try { localStorage.setItem(STORE_KEY, l); } catch { return; }
  applyDoc(l);
  listeners.forEach((fn) => fn());
};
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getLang = () => currentLang;

const validDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
export { validDate };

const interp = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m)) : s);
const makeT = (lang) => (key, vars) => interp(DICT[lang][key] ?? EN[key] ?? key, vars);

const buildFmt = (lang) => {
  const ar = lang === 'ar';
  const l = ar ? 'ar-EG' : 'en-US';
  const g = ar ? 'ar-EG' : 'en-GB';
  const time = new Intl.DateTimeFormat(l, { hour: '2-digit', minute: '2-digit' });
  const day = new Intl.DateTimeFormat(g, { day: '2-digit', month: 'short' });
  const clock = new Intl.DateTimeFormat(g, { hour: '2-digit', minute: '2-digit' });
  const full = new Intl.DateTimeFormat(g, { dateStyle: 'medium', timeStyle: 'short' });
  const short = new Intl.DateTimeFormat(l, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const price = new Intl.NumberFormat(l, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = new Intl.NumberFormat(l);
  return {
    num: (v) => int.format(v),
    price: (p) => { const s = price.format(Number(p) || 0); return ar ? `${s} ج.م` : `EGP ${s}`; },
    time: (d) => time.format(d),
    day: (d) => day.format(d),
    clock: (d) => clock.format(d),
    full: (v) => { const d = validDate(v); return d ? full.format(d) : '—'; },
    short: (v) => { const d = validDate(v); return d ? short.format(d) : '—'; },
  };
};

const CACHE = {};
const ctxFor = (lang) => CACHE[lang] || (CACHE[lang] = {
  lang, isAr: lang === 'ar', dir: lang === 'ar' ? 'rtl' : 'ltr', t: makeT(lang), f: buildFmt(lang),
});

export const useI18n = () => ctxFor(useSyncExternalStore(subscribe, getLang, () => 'en'));

export const useLatest = (value) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

export const NB_FONT = "'Space Grotesk', 'Cairo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
export const NB_FONT_STYLE = { fontFamily: NB_FONT };

export const ensureFonts = () => {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('nb-font')) {
    [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      if (cors) l.crossOrigin = '';
      document.head.appendChild(l);
    });
    const link = document.createElement('link');
    link.id = 'nb-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('nb-font-ar')) {
    const link = document.createElement('link');
    link.id = 'nb-font-ar';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';
    document.head.appendChild(link);
  }
};

const NB_CSS = `
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-dot:#04261a;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:40px;height:12px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
.nb-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-track{height:12px;background:var(--nb-gray);border:2px solid var(--nb-line);overflow:hidden}
.nb-rows>tr+tr{border-top:2px dotted var(--nb-dot)}
.nb-rows>tr:hover{background:var(--nb-gray)}
.nb-soft{background:var(--nb-gray);border:2px solid var(--nb-line);color:var(--nb-ink)}
.nb-tint{background-image:linear-gradient(rgba(52,211,153,.24),rgba(52,211,153,.24))}
.nb-row-on{background:rgba(52,211,153,.16)}
.nb-row-sel{background:var(--nb-gray)}
.nb-rows>tr.nb-row-on:hover{background:rgba(52,211,153,.3)}
.nb-sel{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-check{width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--nb-btn)}
.nb-check:disabled{cursor:not-allowed;opacity:.45}
.nb-agent{display:flex;width:100%;align-items:center;gap:12px;padding:10px 12px;text-align:start;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-agent:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-agent:disabled{opacity:.45;cursor:not-allowed}
.nb-agent:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-agent[aria-checked=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-agent[aria-checked=true] .nb-muted{color:var(--nb-on);opacity:.85}
.nb-overlay{background:rgba(4,38,26,.55)}
.nb-drawer{background:var(--nb-card);color:var(--nb-ink);border-inline-start:3px solid var(--nb-line);animation:nb-in .22s ease-out}
@keyframes nb-in{from{transform:translateX(100%)}to{transform:none}}
@keyframes nb-in-rtl{from{transform:translateX(-100%)}to{transform:none}}
[dir=rtl] .nb-drawer{animation-name:nb-in-rtl}
.nb[dir=rtl] *{letter-spacing:0!important}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-agent{transition:none}.nb-drawer{animation:none}}
`;

const SCROLL_CSS = `
  .slim-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,.6) transparent; }
  .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,.55); }
  .slim-scroll::-webkit-scrollbar-thumb:hover { background: #34d399; }
`;

const STYLE_HTML = { __html: UI3D_CSS + EXTRAS_CSS + NB_CSS + SCROLL_CSS };

export const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const SEARCH_MAX = 60;
export const NOTES_MAX = 500;
export const BTN_MD = 'nb-btn px-3 py-2 text-xs';
export const BTN_ICON = 'nb-btn w-8 h-8';
export const BTN_LG = 'nb-btn h-11 text-sm uppercase';
export const TONE_BG = {
  em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', red: '#fb7185', amber: '#fbbf24', gray: '#d1d5db',
};
const PILL_BG = { em: TONE_BG.em, am: TONE_BG.amber, bl: TONE_BG.cyan, rd: TONE_BG.red, gr: TONE_BG.gray };

export const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; } catch { return true; }
};

export const isNotAssigner = (token) => {
  try {
    const p = jwtDecode(token);
    const found = [p.role, p.roles, p.authorities, p.scope, localStorage.getItem('role')]
      .flat().filter(Boolean).join(' ').toUpperCase();
    return found !== '' && !found.includes('ASSIGNER');
  } catch { return false; }
};

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const NOTES_CTRL = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const SEARCH_STRIP_RE = /[^\p{L}\p{M}\p{N} @._+\-#,'’/()]/gu;
export const clean = (v) => String(v ?? '').replace(CTRL, '');
export const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? clean(v) : '');
export const sanitizeSearch = (v) =>
  clean(v)
    .normalize('NFC')
    .replace(SEARCH_STRIP_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, SEARCH_MAX);
export const sanitizeNotes = (v) =>
  String(v ?? '')
    .normalize('NFC')
    .replace(NOTES_CTRL, '')
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, NOTES_MAX);
export const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
export const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
export const asList = (res) => { const d = res?.data; return Array.isArray(d) ? d : d?.content || []; };
export const shortId = (id) => clean(id).slice(-8).toUpperCase();
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
export const phoneHref = (p) => {
  const digits = String(p ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};
export const mapsUrl = (a) => {
  const q = [a?.street, a?.city, a?.state].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};

export const normAddr = (a) => ({
  building: txt(a?.building), street: txt(a?.street), city: txt(a?.city), state: txt(a?.state),
});
const fullName = (o) => `${txt(o?.firstName)} ${txt(o?.lastName)}`.trim();

export const toItem = (o, priceField, id, preferUserName, defStatus) => {
  const a = fullName(o);
  const b = txt(o.userName);
  return {
    id,
    userName: preferUserName ? b || a : a || b,
    userPhone: txt(o.userPhone) || txt(o.phone),
    userAddr: normAddr(o.userAddress),
    shopName: txt(o.shopName),
    shopPhone: txt(o.shopPhone),
    shopAddr: normAddr(o.shopAddress),
    assignerName: txt(o.assignerName),
    status: String(txt(o.status) || defStatus).toUpperCase(),
    createdAt: o.createdAt,
    ts: Date.parse(o.createdAt) || 0,
    deliveryId: o.deliveryId || null,
    amount: Number(o[priceField]) || 0,
  };
};

export const normAgent = (a) => ({
  id: a.id,
  name: txt(a.name),
  active: Number(a.activeAssignments) || 0,
  available: a.available !== false,
});

export const sortAgents = (list) =>
  [...list].sort((a, b) => (Number(b.available) - Number(a.available)) || a.active - b.active);

const sameItem = (a, b) => {
  const keys = Object.keys(b);
  if (keys.length !== Object.keys(a).length) return false;
  for (const k of keys) {
    const x = a[k];
    const y = b[k];
    if (y && typeof y === 'object') { if (JSON.stringify(x) !== JSON.stringify(y)) return false; } else if (x !== y) return false;
  }
  return true;
};

export const reconcile = (prev, next) => {
  const pm = new Map(prev.map((i) => [i.id, i]));
  let same = prev.length === next.length;
  const out = next.map((n, idx) => {
    const p = pm.get(n.id);
    if (p && sameItem(p, n)) {
      if (prev[idx] !== p) same = false;
      return p;
    }
    same = false;
    return n;
  });
  return same ? prev : out;
};

export const statusLabel = (t, s) => {
  const k = `st.${s}`;
  const v = t(k);
  return v !== k ? v : clean(s).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

export const waitLabel = ({ t, f }, v, now) => {
  const d = validDate(v);
  if (!d) return '—';
  const m = Math.max(0, Math.floor((now - d.getTime()) / 60000));
  if (m < 1) return t('time.now');
  if (m < 60) return t('time.m', { n: f.num(m) });
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hm', { h: f.num(h), m: f.num(m % 60) });
  return t('time.dh', { d: f.num(Math.floor(h / 24)), h: f.num(h % 24) });
};

export const waitTone = (v, now) => {
  const d = validDate(v);
  const h = d ? Math.max(0, (now - d.getTime()) / 3600000) : 0;
  if (h >= 24) return 'text-red-600 dark:text-red-400';
  if (h >= 6) return 'text-amber-700 dark:text-amber-300';
  return '';
};

export const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

export const nextSort = (s, field, first = 'asc') =>
  (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: first });

export const notify = (icon, title, text) => toast({ icon, title, text });

let swalPromise = null;
export const confirmAction = async ({ title, text, confirmText, cancelText }) => {
  try {
    swalPromise ||= import('sweetalert2').then((m) => m.default);
    const Swal = await swalPromise;
    const root = document.documentElement;
    const dark = root.classList.contains('dark');
    const { isConfirmed } = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#4b6b5c',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: root.dir === 'rtl',
      background: dark ? '#2a2a2a' : '#ffffff',
      color: dark ? '#ffffff' : '#04261a',
    });
    return isConfirmed;
  } catch {
    return false;
  }
};

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setDark(el.classList.contains('dark')));
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

export const useNow = (ms = 60000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
};

export const useAuth = () => {
  const navigate = useNavigate();
  const ctx = useI18n();
  const ctxRef = useLatest(ctx);
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(
    () => !tokenRef.current || isTokenExpired(tokenRef.current) || isNotAssigner(tokenRef.current),
    []
  );

  const logout = useCallback(() => {
    localStorage.clear();
    navigate('/login', { replace: true });
  }, [navigate]);

  const forbid = useCallback(() => {
    const { t } = ctxRef.current;
    notify('error', t('toast.denied.title'), t('toast.denied.text'));
    navigate('/login', { replace: true });
  }, [navigate, ctxRef]);

  useEffect(() => {
    if (!denied) return;
    const token = tokenRef.current;
    if (token && !isTokenExpired(token)) {
      const { t } = ctxRef.current;
      notify('error', t('toast.denied.title'), t('toast.denied.text'));
    } else localStorage.clear();
    navigate('/login', { replace: true });
  }, [denied, navigate, ctxRef]);

  return { tokenRef, denied, logout, forbid };
};

export const PageShell = ({ darkMode, children }) => {
  const { dir } = useI18n();
  return (
    <div
      dir={dir}
      style={NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden`}
    >
      <style dangerouslySetInnerHTML={STYLE_HTML} />
      <Defs3D />
      <Toaster darkMode={darkMode} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">{children}</div>
    </div>
  );
};

export const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

export const LangSwitch = memo(() => {
  const { t, lang } = useI18n();
  return (
    <div role="group" aria-label={t('lang.label')} className="flex gap-1.5">
      {[['en', 'EN'], ['ar', 'عربي']].map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`nb-btn h-10 px-3 text-xs ${lang === code ? 'nb-btn-on' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

export const PageHeader = memo(({ eyebrow, title, subtitle, lastUpdated, loading, onRefresh, refreshLabel }) => {
  const { t, f } = useI18n();
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
        <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.25]">
          <UnderlinedTitle text={title} />
        </h1>
        <p className="nb-muted mt-2 text-sm font-medium">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">{t('lastUpdated', { time: f.time(lastUpdated) })}</p>}
        <LangSwitch />
        <button type="button" onClick={onRefresh} aria-label={refreshLabel} title={t('refresh')} className={`${BTN_MD} h-10 uppercase`}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {t('refresh')}
        </button>
      </div>
    </div>
  );
});

const IconTile = memo(({ icon: Icon, tone = 'em', className = 'w-11 h-11', size = 18 }) => (
  <span className={`nb-tile ${className}`} style={{ background: TONE_BG[tone] }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

const Ring = memo(({ percent, color }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex-shrink-0" role="img" aria-label={`${percent}%`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" style={{ stroke: 'var(--nb-gray)' }} />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="8"
          stroke={color}
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          style={{ transition: REDUCED ? 'none' : 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">
        {percent}%
      </span>
    </div>
  );
});

export const StatCard = memo(({ label, value, description, icon, tone, percent, color }) => (
  <div className="nb-card nb-lift p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0">
    <div className="min-w-0 flex-1 text-start">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} />
        <div className="min-w-0">
          <p className="nb-muted text-[11px] font-bold uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
        </div>
      </div>
      <p className="nb-muted mt-3 text-xs font-semibold truncate">{description}</p>
    </div>
    {percent !== undefined && <Ring percent={percent} color={color} />}
  </div>
));

export const Pill = memo(({ tone, children }) => (
  <span className="nb-chip" style={{ background: PILL_BG[tone] || PILL_BG.gr, color: '#04261a' }}>
    <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
    {children}
  </span>
));

export const SortTh = memo(({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  return (
    <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase hover:underline underline-offset-4">
        {label}
        <span className={`flex flex-col -space-y-1 ${active ? 'nb-ic' : 'nb-muted'}`} aria-hidden="true">
          <FiChevronUp size={10} className={active && sort.dir === 'asc' ? '' : 'opacity-50'} />
          <FiChevronDown size={10} className={active && sort.dir === 'desc' ? '' : 'opacity-50'} />
        </span>
      </button>
    </th>
  );
});

export const Th = ({ children }) => (
  <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase">{children}</th>
);

export const SelectAll = memo(({ checked, indeterminate, disabled, onChange, label }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} className="nb-check" />;
});

export const Dropdown = memo(({ value, options, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}>
        <span>{current?.label}</span>
        <FiChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="nb-menu absolute end-0 z-20 mt-2 w-full min-w-max overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={value === o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="nb-opt"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const Toolbar = memo(({
  id, search, onSearch, placeholder, label, rows, rowsOptions, onRows, rowsLabel, showViews, view, onView,
}) => {
  const { t, f } = useI18n();
  const handleChange = useCallback((e) => onSearch(sanitizeSearch(e.target.value)), [onSearch]);
  const handlePaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.length > 500) e.preventDefault();
  }, []);
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onSearch('');
    else if (e.key === 'Enter') e.preventDefault();
  }, [onSearch]);
  const clear = useCallback(() => onSearch(''), [onSearch]);
  const options = useMemo(() => rowsOptions.map((n) => ({ value: n, label: t('rows', { n: f.num(n) }) })), [rowsOptions, t, f]);

  return (
    <div className="nb-line p-3 sm:p-4 flex flex-wrap items-center gap-2.5 border-b-2">
      <div className="nb-field relative flex h-10 min-w-[220px] flex-1 items-center gap-2 px-3">
        <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
        <label htmlFor={id} className="sr-only">{label}</label>
        <input
          id={id}
          name={id}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={SEARCH_MAX}
          value={search}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {search && (
          <button type="button" onClick={clear} aria-label={t('search.clear')} className="flex-shrink-0 nb-muted hover:text-[var(--nb-accent)]">
            <FiX size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      <Dropdown value={rows} options={options} onChange={onRows} ariaLabel={rowsLabel} />
      {showViews && (
        <div role="group" aria-label={t('view.group')} className="flex gap-1.5">
          <button type="button" onClick={() => onView('table')} aria-pressed={view === 'table'} className={`${BTN_MD} h-10 uppercase ${view === 'table' ? 'nb-btn-on' : ''}`}>
            <FiList size={14} aria-hidden="true" /> {t('view.table')}
          </button>
          <button type="button" onClick={() => onView('cards')} aria-pressed={view === 'cards'} className={`${BTN_MD} h-10 uppercase ${view === 'cards' ? 'nb-btn-on' : ''}`}>
            <FiGrid size={14} aria-hidden="true" /> {t('view.cards')}
          </button>
        </div>
      )}
    </div>
  );
});

export const Tabs = memo(({ tabs, value, counts, onChange }) => {
  const { t, f } = useI18n();
  return (
    <div role="tablist" aria-label={t('tabs.assignment')} className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 last:border-b-0 [scrollbar-width:none]">
      {tabs.map(({ key, tk }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`nb-btn flex-shrink-0 px-3 py-1.5 text-xs uppercase ${active ? 'nb-btn-on' : ''}`}
          >
            {t(tk)}
            <span className="nb-chip tabular-nums">{f.num(counts[key] || 0)}</span>
          </button>
        );
      })}
    </div>
  );
});

const Pagination = memo(({ page, total, onChange }) => {
  const { t, isAr } = useI18n();
  const Prev = isAr ? FiChevronRight : FiChevronLeft;
  const Next = isAr ? FiChevronLeft : FiChevronRight;
  return (
    <nav className="flex items-center gap-1.5" aria-label={t('page.nav')}>
      <button type="button" className={BTN_ICON} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t('page.prev')}><Prev size={16} aria-hidden="true" /></button>
      {pageList(page, total).map((p) => (typeof p === 'string'
        ? <span key={p} className="w-6 text-center text-xs font-bold">…</span>
        : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={t('page.go', { n: p })}
            aria-current={p === page ? 'page' : undefined}
            className={`nb-btn w-8 h-8 text-xs tabular-nums ${p === page ? 'nb-btn-on' : ''}`}
          >
            {p}
          </button>
        )))}
      <button type="button" className={BTN_ICON} onClick={() => onChange(page + 1)} disabled={page >= total} aria-label={t('page.next')}><Next size={16} aria-hidden="true" /></button>
    </nav>
  );
});

export const PageBar = memo(({ page, totalPages, total, perPage, items, onChange, boxed }) => {
  const { t, f } = useI18n();
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);
  return (
    <div className={`${boxed ? 'nb-card' : 'nb-gray nb-line border-t-2'} px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
      <p className="text-xs font-semibold">
        {t('showing', { from: f.num(from), to: f.num(to), total: f.num(total), items })}
      </p>
      {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={onChange} />}
    </div>
  );
});

export const EmptyState = memo(({ title, subtitle, actionLabel, onAction, darkMode }) => (
  <div className="flex flex-col items-center">
    <EmptyState3D kind="box" title={title} subtitle={subtitle} darkMode={darkMode} />
    {actionLabel && (
      <button type="button" onClick={onAction} className={`${BTN_MD} nb-btn-a mt-4 uppercase`}>{actionLabel}</button>
    )}
  </div>
));

export const ErrorState = memo(({ title, subtitle, retryLabel, onRetry }) => (
  <div className="text-center">
    <FiAlertCircle size={28} className="mx-auto text-red-500" aria-hidden="true" />
    <p className="mt-2 text-sm font-extrabold uppercase">{title}</p>
    <p className="nb-muted text-xs mb-4">{subtitle}</p>
    <button type="button" onClick={onRetry} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} aria-hidden="true" /> {retryLabel}</button>
  </div>
));

export const CardSkeleton = memo(() => (
  <li aria-hidden="true" className="nb-card p-4 animate-pulse motion-reduce:animate-none space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2"><div className="nb-gray h-8 w-28" /><div className="nb-gray h-3 w-20" /></div>
      <div className="nb-gray h-6 w-24" />
    </div>
    <div className="nb-gray h-16" />
    <div className="space-y-3"><div className="nb-gray h-10" /><div className="nb-gray h-10" /></div>
    <div className="grid grid-cols-2 gap-3"><div className="nb-gray h-11" /><div className="nb-gray h-11" /></div>
  </li>
));

export const SkeletonRows = memo(({ count, cols }) => (
  Array.from({ length: count }, (_, i) => (
    <tr key={i} className="animate-pulse motion-reduce:animate-none">
      {Array.from({ length: cols }, (__, j) => (
        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
      ))}
    </tr>
  ))
));

const Stop = memo(({ kind, label, title, subtitle, address }) => {
  const { t } = useI18n();
  const url = mapsUrl(address);
  const Icon = kind === 'pickup' ? FiShoppingBag : FiMapPin;
  return (
    <div className="relative flex items-start gap-3">
      <span className="nb-tile w-8 h-8" style={{ background: kind === 'pickup' ? TONE_BG.teal : TONE_BG.em }}>
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="nb-muted text-[11px] font-extrabold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-extrabold break-words">{title || t('notProvided')}</p>
        {subtitle && <p className="nb-muted text-xs font-semibold break-words">{subtitle}</p>}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t(kind === 'pickup' ? 'maps.pickup' : 'maps.drop')} className="nb-btn w-9 h-9 flex-shrink-0">
          <FiNavigation size={15} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

export const Route = memo(({ item, labels }) => {
  const { t } = useI18n();
  const sa = item.shopAddr;
  const ua = item.userAddr;
  const shopSub = [sa.street, sa.city].filter(Boolean).join(', ') || item.shopPhone;
  const dropTitle = [ua.building, ua.street].filter(Boolean).join(' ') || t('addr.none');
  const dropSub = [ua.city, ua.state].filter(Boolean).join(', ');
  return (
    <div className="relative space-y-4">
      <span aria-hidden="true" className="nb-line absolute start-4 top-8 bottom-8 border-s-2 border-dashed ltr:-translate-x-1/2 rtl:translate-x-1/2" />
      <Stop kind="pickup" label={labels.pickup} title={item.shopName || t('shop')} subtitle={shopSub} address={sa} />
      <Stop kind="dropoff" label={labels.dropoff} title={dropTitle} subtitle={dropSub} address={ua} />
    </div>
  );
});

export const CustomerBox = memo(({ item }) => {
  const { t } = useI18n();
  const name = item.userName || t('customer');
  const tel = phoneHref(item.userPhone);
  return (
    <div className="nb-soft flex items-center gap-3 p-3">
      <span className="nb-tile w-10 h-10 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold uppercase truncate">{name}</p>
        <p dir="ltr" className="nb-muted text-xs font-semibold truncate text-start">{item.userPhone || t('phone.none')}</p>
      </div>
      {tel && (
        <a href={tel} aria-label={t('call', { name })} className="nb-btn nb-btn-a w-10 h-10 flex-shrink-0">
          <FiPhone size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

export const InfoRow = memo(({ icon: Icon, label, value, ltr }) => (
  <div className="nb-soft flex items-center gap-3 p-3">
    <IconTile icon={Icon} tone="em" className="w-9 h-9" size={16} />
    <div className="min-w-0">
      <p className="nb-muted text-[11px] font-extrabold uppercase tracking-wide">{label}</p>
      <p dir={ltr ? 'ltr' : undefined} className="text-sm font-bold break-words text-start">{value || '—'}</p>
    </div>
  </div>
));

const AgentOption = memo(({ agent, selected, disabled, onPick }) => {
  const { t, f } = useI18n();
  const name = agent.name || t('agent.unnamed');
  const offline = !agent.available;
  const n = agent.active;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled || offline}
      onClick={() => onPick(agent.id)}
      className="nb-agent"
    >
      <span className="nb-tile w-10 h-10 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold uppercase truncate">{name}</span>
        <span className="nb-muted flex items-center gap-1 text-[11px] font-bold">
          <FiTrendingUp size={11} aria-hidden="true" />
          {t(n === 1 ? 'agent.task.one' : 'agent.task.many', { n: f.num(n) })}
        </span>
      </span>
      {selected ? (
        <span className="nb-tile w-6 h-6" style={{ background: TONE_BG.em }}><FiCheck size={14} aria-hidden="true" /></span>
      ) : (
        <Pill tone={offline ? 'gr' : n ? 'am' : 'em'}>{offline ? t('agent.unavailable') : n ? t('agent.busy') : t('agent.free')}</Pill>
      )}
    </button>
  );
});

export const AgentPicker = ({ agents, picked, onPick, busy, title, emptyKey }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? agents.filter((a) => a.name.toLowerCase().includes(q)) : agents;
  }, [agents, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wide">{title}</p>
        <p className="nb-muted text-[11px] font-bold">{t('drawer.leastBusy')}</p>
      </div>
      {agents.length > 6 && (
        <div className="nb-field flex h-10 items-center gap-2 px-3 mb-2.5">
          <FiSearch size={14} className="flex-shrink-0" aria-hidden="true" />
          <label htmlFor="agent-search" className="sr-only">{t('agent.search')}</label>
          <input
            id="agent-search"
            type="search"
            value={query}
            maxLength={SEARCH_MAX}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => setQuery(sanitizeSearch(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder={t('agent.search')}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      )}
      <div role="radiogroup" aria-label={t('agent.group')} className="space-y-2.5">
        {agents.length === 0 ? (
          <p className="nb-muted py-6 text-center text-xs font-bold">{t(emptyKey)}</p>
        ) : visible.length === 0 ? (
          <p className="nb-muted py-6 text-center text-xs font-bold">{t('drawer.noMatch')}</p>
        ) : (
          visible.map((a) => <AgentOption key={a.id} agent={a} selected={picked === a.id} disabled={busy} onPick={onPick} />)
        )}
      </div>
    </div>
  );
};

export const NotesField = ({ id, label, value, onChange }) => {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide">{label}</label>
      <textarea
        id={id}
        value={value}
        maxLength={NOTES_MAX}
        onChange={(e) => onChange(sanitizeNotes(e.target.value))}
        placeholder={t('drawer.notes.ph')}
        className="nb-field h-24 w-full resize-none px-3 py-2 text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
      />
      <p className="nb-muted mt-1 text-end text-[10px] font-bold tabular-nums">{value.length}/{NOTES_MAX}</p>
    </div>
  );
};

export const DrawerShell = ({ title, subtitle, busy, onClose, footer, children }) => {
  const { t } = useI18n();
  const closeRef = useRef(null);

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="nb-overlay absolute inset-0" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="nb-drawer absolute inset-y-0 end-0 flex w-full max-w-md flex-col">
        <div className="nb-gray nb-line flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b-2 px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold uppercase">{title}</h2>
            {subtitle}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} disabled={busy} aria-label={t('drawer.close')} className={BTN_ICON}>
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="slim-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">{children}</div>
        <div className="nb-gray nb-line flex flex-shrink-0 gap-3 border-t-2 px-5 py-4">{footer}</div>
      </aside>
    </div>
  );
};

export const IdSubtitle = memo(({ id, onCopy }) => {
  const { t } = useI18n();
  return (
    <p className="nb-muted flex items-center gap-1.5 text-[10px] font-bold font-mono">
      #{shortId(id)}
      <button type="button" aria-label={t('copy.title')} onClick={() => onCopy(id)} className="hover:text-[var(--nb-accent)] transition-colors">
        <FiCopy size={10} aria-hidden="true" />
      </button>
    </p>
  );
});