import api from '../api/api';



export const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];
export const CONDITION_LABELS = { NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدّد', all: 'الكل' };

export const EMPTY_PRODUCT = {
  name: '', description: '', price: '', categoryId: '', stockQuantity: '', condition: 'NEW', image: null,
};

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; 
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PRICE_MAX = 10_000_000;
export const STOCK_MAX = 1_000_000;



export const UPLOADS_BASE = '';

const serverOrigin = () => {
  if (UPLOADS_BASE) return UPLOADS_BASE.replace(/\/+$/, '');
  try { return new URL(api.defaults?.baseURL || '', window.location.origin).origin; } catch { return window.location.origin; }
};

export const resolveImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim().replace(/\\/g, '/');
  if (!s || s.length > 500) return '';


  
  if (/^blob:/i.test(s)) return s;
  if (/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(s)) return s;
 
  
  if (/^https?:\/\//i.test(s)) return s;
  
  
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) return '';

  const parts = s.split('/').filter((p) => p && p !== '.');
  if (!parts.length || parts.includes('..')) return ''; 
  const at = parts.indexOf('uploads');
  const rel = at >= 0 ? parts.slice(at) : ['uploads', ...parts]; 
  return `${serverOrigin()}/${rel.map(encodeURIComponent).join('/')}`;
};



export const rawImageOf = (p) => p?.imageUrl ?? p?.imagePath ?? p?.image ?? p?.imageName ?? p?.imageFileName ?? '';




const startsWith = (bytes, sig, offset = 0) => sig.every((b, i) => bytes[offset + i] === b);

export const validateImageFile = async (file) => {
  if (!(file instanceof File)) return 'ملف الصورة غير صالح';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'الصيغ المسموحة: JPG أو PNG أو WEBP';
  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) return 'امتداد الملف غير مدعوم';
  if (file.size === 0) return 'الملف فارغ';
  if (file.size > IMAGE_MAX_BYTES) return `حجم الصورة يجب ألا يتجاوز ${IMAGE_MAX_BYTES / 1024 / 1024} ميجابايت`;


  
  try {
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpeg = startsWith(b, [0xff, 0xd8, 0xff]);
    const png = startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8);
    if (!(jpeg || png || webp)) return 'محتوى الملف ليس صورة صالحة';
  } catch {
    return 'تعذر قراءة الملف';
  }
  return null;
};



export const validateProduct = (p, categories = []) => {
  const name = String(p.name ?? '').trim();
  const description = String(p.description ?? '').trim();
  const price = Number(p.price);
  const stock = Number(p.stockQuantity);

  if (!name) return 'اسم المنتج مطلوب';
  if (name.length > 120) return 'اسم المنتج طويل جداً (الحد الأقصى ١٢٠ حرفاً)';
  if (!description) return 'وصف المنتج مطلوب';
  if (description.length > 2000) return 'الوصف طويل جداً (الحد الأقصى ٢٠٠٠ حرف)';
  if (p.price === '' || !Number.isFinite(price) || price <= 0 || price > PRICE_MAX) return 'أدخل سعراً صحيحاً أكبر من صفر';
  if (!p.categoryId) return 'يرجى اختيار فئة';
  if (categories.length && !categories.some((c) => String(c.id) === String(p.categoryId))) return 'الفئة المختارة غير صالحة';
  if (p.stockQuantity === '' || !Number.isInteger(stock) || stock < 0 || stock > STOCK_MAX) return 'أدخل كمية صحيحة (عدد صحيح من صفر فأكثر)';
  if (!CONDITIONS.includes(p.condition)) return 'حالة المنتج غير صالحة';
  if (!p.image) return 'صورة المنتج مطلوبة';
  if (p.image instanceof File) {
    if (!ALLOWED_IMAGE_TYPES.includes(p.image.type)) return 'الصيغ المسموحة: JPG أو PNG أو WEBP';
    if (p.image.size > IMAGE_MAX_BYTES) return 'حجم الصورة كبير جداً';
  }
  return null;
};



export const buildFormData = (p) => {
  const fd = new FormData();
  fd.append('name', String(p.name).trim());
  fd.append('description', String(p.description).trim());
  fd.append('price', String(Math.round(Number(p.price) * 100) / 100));
  fd.append('categoryId', String(p.categoryId));
  fd.append('stockQuantity', String(parseInt(p.stockQuantity, 10)));
  fd.append('condition', p.condition);
 
  if (p.image instanceof File) fd.append('image', p.image, p.image.name);
  return fd;
};