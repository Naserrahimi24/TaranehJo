// ------------------------------
// server.js - Taraneh-Jo (نسخه نهایی واقعی)
// ------------------------------
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const ZarinpalCheckout = require('zarinpal-checkout');

// ------------------------------
// تنظیمات اولیه
// ------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------
// تنظیمات Express و EJS
// ------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'taranehjo-secret',
  resave: false,
  saveUninitialized: true
}));

// اطلاعات کاربر به همه‌ی Viewها ارسال می‌شود
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ------------------------------
// اتصال به زرین‌پال (واقعی)
// ------------------------------
const zarinpal = ZarinpalCheckout.create(
  process.env.ZARINPAL_MERCHANT || '', // ← Merchant ID واقعی خودت رو در .env بنویس
  false // ← false یعنی حالت واقعی، true یعنی sandbox
);

// ------------------------------
// تابع خواندن فایل خوانندگان
// ------------------------------
function readArtists() {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'artists.json');
    if (!fs.existsSync(filePath)) {
      console.error('❌ فایل artists.json پیدا نشد:', filePath);
      return {};
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ خطا در خواندن فایل artists.json:', err.message);
    return {};
  }
}

// ------------------------------
// مسیرها
// ------------------------------

// 🏠 صفحه اصلی
app.get('/', (req, res) => {
  const artists = readArtists();
  const list = Array.isArray(artists) ? artists : Object.values(artists);
  res.render('index', { artists: list });
});

// 🎤 صفحه خواننده
app.get('/artist/:id', (req, res) => {
  const id = req.params.id;
  const artists = readArtists();
  const artist = artists[id] || Object.values(artists).find(a => a.id == id);

  if (!artist) return res.status(404).send('خواننده پیدا نشد');

  const user = req.session.user || null;
  const isAdmin = user && user.is_admin;
  const hasActiveSub = user && user.subscription_end && (new Date(user.subscription_end) > new Date());

  let songs = artist.songs || [];
  if (!isAdmin && !hasActiveSub) {
    songs = songs.slice(0, 2); // فقط دو آهنگ اول برای کاربران عادی
  }

  res.render('artist', { artist: { ...artist, songs }, artistId: id });
});

// 👤 ورود
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
  const { username, password } = req.body;

 const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

// ...
if (username === ADMIN_USER && password === ADMIN_PASS) {
  req.session.user = {
    username,
    display_name: 'مدیر سایت',
    is_admin: true,
    subscription_end: null
  };
  return res.redirect('/');
}


  if (!username || !password)
    return res.render('login', { error: 'نام کاربری یا رمز اشتباه است' });

  req.session.user = { username, display_name: username, is_admin: false, subscription_end: null };
  res.redirect('/');
});

// 🚪 خروج
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// 🧾 ثبت‌نام
app.get('/register', (req, res) => res.render('register', { step: 1, error: null }));

app.post('/register', async (req, res) => {
  const { phone } = req.body;
  if (!phone)
    return res.render('register', { step: 1, error: 'لطفا شماره موبایل وارد کنید' });

  const code = Math.floor(1000 + Math.random() * 9000);
  req.session.verifyCode = code;
  req.session.pendingPhone = phone;
  req.session.verifyExpires = Date.now() + 5 * 60 * 1000;

  try {
    // ارسال پیامک واقعی با ملی پیامک
    const payload = {
      from: process.env.SMS_FROM,
      to: phone,
      text: `کد تایید شما در ترانه‌جو: ${code}`
    };

    const response = await axios.post(
      'https://console.melipayamak.com/api/send/simple',
      {
        username: process.env.SMS_API_KEY,
        password: process.env.SMS_API_KEY,
        ...payload
      }
    );

    console.log('📩 پیامک ارسال شد:', response.data);
  } catch (err) {
    console.error('⚠️ خطا در ارسال پیامک:', err.message);
  }

  res.render('register', { step: 2, error: null });
});

app.post('/verify', (req, res) => {
  const { code } = req.body;

  if (!req.session.verifyCode || !req.session.pendingPhone)
    return res.render('register', { step: 1, error: 'اجازه ثبت‌نام ندارید. دوباره تلاش کنید.' });

  if (Date.now() > req.session.verifyExpires)
    return res.render('register', { step: 1, error: 'کد منقضی شده؛ دوباره شماره را وارد کنید.' });

  if (parseInt(code) !== parseInt(req.session.verifyCode))
    return res.render('register', { step: 2, error: 'کد وارد شده اشتباه است' });

  req.session.user = {
    username: req.session.pendingPhone,
    display_name: req.session.pendingPhone,
    is_admin: false,
    subscription_end: null
  };

  delete req.session.verifyCode;
  delete req.session.pendingPhone;
  delete req.session.verifyExpires;

  res.redirect('/');
});

// 💳 خرید اشتراک با زرین‌پال
app.post('/buy-sub', async (req, res) => {
  if (!req.session.user)
    return res.status(403).json({ ok: false, error: 'ابتدا وارد شوید' });

  const callbackUrl = `http://localhost:${PORT}/verify-payment`;

  try {
    const result = await zarinpal.PaymentRequest({
      Amount: 30000, // مبلغ به تومان (مثلاً 30 هزار تومن)
      CallbackURL: callbackUrl,
      Description: 'خرید اشتراک ۳۰ روزه در ترانه‌جو',
      Email: req.session.user.username + '@taranehjo.com'
    });

    if (result.status === 100) {
      res.json({ ok: true, url: result.url });
    } else {
      res.status(400).json({ ok: false, error: 'خطا در ایجاد پرداخت' });
    }
  } catch (err) {
    console.error('❌ خطا در اتصال به زرین‌پال:', err.message);
    res.status(500).json({ ok: false, error: 'خطا در اتصال به درگاه پرداخت' });
  }
});

// ✅ تأیید پرداخت از زرین‌پال
app.get('/verify-payment', async (req, res) => {
  const { Authority, Status } = req.query;

  if (Status !== 'OK')
    return res.send('پرداخت لغو شد.');

  try {
    const result = await zarinpal.PaymentVerification({
      Amount: 30000,
      Authority
    });

    if (result.status === 100) {
      const now = new Date();
      const newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      req.session.user.subscription_end = newEnd.toISOString();
      res.send('✅ پرداخت موفق بود و اشتراک شما فعال شد.');
    } else {
      res.send('❌ پرداخت ناموفق بود.');
    }
  } catch (err) {
    console.error('❌ خطا در تأیید پرداخت:', err.message);
    res.send('خطا در بررسی پرداخت.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 سرور ترانه‌جو روی پورت ${port} اجرا شد`));

