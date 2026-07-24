# FeedBan 🛡️

[English](#english) · [فارسی](#فارسی)

## English

FeedBan is a small helper for X (Twitter). You give it an emoji or phrase, and it looks for that match in account display names and bios.

It can work in two ways:

- **Dry Run:** safely highlights matches without blocking anyone.
- **Automatic mode:** uses X’s own menus to block matched accounts.

FeedBan works on both `x.com` and `twitter.com`.

> **Please start with Dry Run.** X does not publish a guaranteed safe speed for automatic blocking, and its rules may restrict scripted actions on the website. Automatic blocking can put your account at risk. No delay can make it completely safe.

### What FeedBan checks

FeedBan checks:

- Account display names
- Bios that are currently visible on the page or in a user card
- Regular text, emojis, flags, and joined emoji sequences

FeedBan does **not** check the text inside posts. For example, if someone uses 🎒 in a post but not in their display name or bio, FeedBan will not match that account.

### Easiest installation

You only need two clicks after installing Tampermonkey:

1. Install **Tampermonkey** in your browser from [tampermonkey.net](https://www.tampermonkey.net/).
2. Click **[🛡️ Install FeedBan](https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js)**.
3. Tampermonkey will open an installation page. Click **Install**.
4. Open [x.com](https://x.com/) and refresh the page.

You should now see the **FeedBan 🛡️** panel in the bottom-right corner.

You can also scan this QR code after installing a userscript manager:

<a href="https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js">
  <img src="./assets/feedban-install-qr.png" width="220" alt="QR code to install FeedBan">
</a>

If clicking the install link only shows a page of text, make sure Tampermonkey is installed and enabled, then click the link again. The same install link also works with Violentmonkey.

FeedBan includes an update address, so your userscript manager can check this repository for newer versions.

### Your first safe test

Dry Run is switched on the first time FeedBan starts, so nobody should be blocked during this test.

1. Make sure **Automatic scanning** is on.
2. Make sure **Test / Dry Run** is on.
3. In the Filters box, enter part of a display name you can currently see on X.
4. Click **Add**.
5. The matching account should get a yellow outline and a light red background.
6. Open **Recent activity** to see the match.

You can test an emoji in the same way. The emoji must appear in the account’s display name or visible bio—not only inside a post.

### Using filters

- Type an emoji or phrase into the box and click **Add**.
- Matching is not sensitive to uppercase or lowercase letters.
- To remove a filter, click the small `×` beside it.
- Keep filters specific. A short, common word may match many accounts.

### Turning automatic blocking on

Only do this after your filters work correctly in Dry Run.

1. Remove any broad or accidental filters.
2. Switch **Test / Dry Run** off.
3. Leave **Automatic scanning** on.

FeedBan will try to open X’s menu, choose Block, and confirm it. The counters and Recent activity list will show completed attempts.

FeedBan includes a temporary safety pause when too many blocks happen close together. This reduces risk, but it does not guarantee that X will accept the automation.

### Pause or remove FeedBan

- To pause scanning, switch **Automatic scanning** off.
- To hide most of the panel, click the `−` button.
- To disable FeedBan completely, open Tampermonkey and switch FeedBan off.
- To remove it, open the Tampermonkey dashboard and delete FeedBan.

Disabling the script does not stop code already running in an open tab. Close or refresh existing X tabs after disabling it.

### If something is not working

**The panel does not appear**

- Make sure FeedBan is enabled in Tampermonkey.
- Make sure you are on `x.com` or `twitter.com`.
- Refresh the page.

**Text matches, but an emoji does not**

- Make sure the emoji is in the display name or visible bio.
- Replace your installed script with the newest copy of `feedban.user.js`.
- Save it and refresh X.

**A match is highlighted but not blocked**

- Check that Dry Run is off.
- X may have changed its menus, or the block command may not be available on that card.
- Look at Recent activity for the reason.

**X becomes slow or stays on its loading logo**

- Disable FeedBan.
- Close the stuck X tab completely.
- Open X in a new tab.
- Make sure you are using the latest version of FeedBan before enabling it again.

Messages in the browser console about ads, Content Security Policy, or `beforeinstallprompt` usually come from X itself and are not FeedBan errors.

### Privacy

FeedBan runs in your browser. Its settings, filters, counters, and activity history are stored by your userscript manager.

FeedBan does not collect X authorization tokens and does not send your filters to a separate FeedBan server.

---

## فارسی

فیدبان یک ابزار کوچک برای X (توییتر) است. شما یک ایموجی یا عبارت به آن می‌دهید و فیدبان همان مورد را داخل نام نمایشی یا بیوی حساب‌ها پیدا می‌کند.

فیدبان دو حالت دارد:

- **حالت آزمایشی (Dry Run):** فقط حساب‌های پیدا شده را رنگی می‌کند و کسی را بلاک نمی‌کند.
- **حالت خودکار:** از منوهای خود X استفاده می‌کند تا حساب‌های پیدا شده را بلاک کند.

این ابزار هم روی `x.com` و هم روی `twitter.com` کار می‌کند.

> **لطفاً اول با حالت آزمایشی شروع کنید.** X سرعت تضمین‌شده‌ای برای بلاک خودکار اعلام نکرده و قوانینش ممکن است استفاده از اسکریپت برای انجام خودکار کارها در سایت را محدود کند. بلاک خودکار می‌تواند برای حساب شما ریسک داشته باشد و هیچ فاصله زمانی‌ای آن را کاملاً امن نمی‌کند.

### فیدبان دقیقاً چه چیزهایی را بررسی می‌کند؟

فیدبان این موارد را بررسی می‌کند:

- نام نمایشی حساب
- بیویی که در همان لحظه داخل صفحه یا کارت کاربر دیده می‌شود
- متن معمولی، ایموجی، پرچم و ایموجی‌های ترکیبی

فیدبان متن داخل پست‌ها را بررسی **نمی‌کند**. مثلاً اگر کسی 🎒 را فقط داخل یک پست نوشته باشد، ولی این ایموجی در نام یا بیوی او نباشد، آن حساب پیدا نمی‌شود.

### نصب خیلی ساده

بعد از نصب Tampermonkey فقط با دو کلیک کار تمام است:

1. از سایت [tampermonkey.net](https://www.tampermonkey.net/) افزونه **Tampermonkey** را روی مرورگرتان نصب کنید.
2. روی **[🛡️ نصب فیدبان](https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js)** بزنید.
3. صفحه نصب Tampermonkey باز می‌شود؛ روی **Install** بزنید.
4. وارد [x.com](https://x.com/) شوید و صفحه را تازه‌سازی کنید.

حالا باید پنل **فیدبان 🛡️** را پایین سمت راست صفحه ببینید.

بعد از نصب یک افزونه مدیریت اسکریپت، می‌توانید این کد QR را هم اسکن کنید:

<a href="https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js">
  <img src="./assets/feedban-install-qr.png" width="220" alt="کد QR نصب فیدبان">
</a>

اگر با زدن لینک نصب فقط یک صفحه پر از متن دیدید، مطمئن شوید Tampermonkey نصب و روشن است و دوباره روی لینک بزنید. همین لینک با Violentmonkey هم کار می‌کند.

فیدبان آدرس به‌روزرسانی را هم داخل خودش دارد تا افزونه مدیریت اسکریپت بتواند نسخه‌های جدیدتر را از همین مخزن بررسی کند.

### اولین تست امن

فیدبان در اولین اجرا با حالت آزمایشی روشن می‌شود؛ پس در این تست نباید کسی بلاک شود.

1. مطمئن شوید **Automatic scanning** روشن است.
2. مطمئن شوید **Test / Dry Run** هم روشن است.
3. داخل بخش Filters قسمتی از نام نمایشی یکی از حساب‌هایی را بنویسید که الان در X می‌بینید.
4. روی **Add** بزنید.
5. دور حساب پیدا شده باید یک خط زرد و پس‌زمینه قرمز کم‌رنگ دیده شود.
6. بخش **Recent activity** را باز کنید تا نتیجه را ببینید.

برای ایموجی هم می‌توانید همین کار را انجام دهید. ایموجی باید در نام نمایشی یا بیوی قابل‌مشاهده حساب باشد، نه اینکه فقط داخل متن یک پست آمده باشد.

### کار با فیلترها

- ایموجی یا عبارت موردنظرتان را داخل کادر بنویسید و **Add** را بزنید.
- حروف بزرگ و کوچک تفاوتی ندارند.
- برای پاک کردن هر فیلتر، روی علامت `×` کنار آن بزنید.
- بهتر است عبارت‌های دقیق انتخاب کنید. یک کلمه کوتاه و رایج ممکن است تعداد زیادی حساب را پیدا کند.

### روشن کردن بلاک خودکار

فقط وقتی این کار را انجام دهید که فیلترها را در حالت آزمایشی امتحان کرده‌اید و نتیجه درست بوده است.

1. فیلترهای خیلی کلی یا اشتباهی را پاک کنید.
2. گزینه **Test / Dry Run** را خاموش کنید.
3. گزینه **Automatic scanning** را روشن نگه دارید.

فیدبان تلاش می‌کند منوی X را باز کند، گزینه Block را بزند و آن را تأیید کند. تعداد بلاک‌ها و نتیجه تلاش‌ها در شمارنده‌ها و بخش Recent activity نمایش داده می‌شود.

اگر در زمان کوتاه تعداد زیادی بلاک انجام شود، فیدبان موقتاً کار را متوقف می‌کند. این توقف ریسک را کمتر می‌کند، اما تضمین نمی‌کند که X این نوع استفاده خودکار را بپذیرد.

### توقف یا حذف فیدبان

- برای توقف بررسی صفحه، **Automatic scanning** را خاموش کنید.
- برای کوچک کردن پنل، روی دکمه `−` بزنید.
- برای غیرفعال کردن کامل، Tampermonkey را باز کنید و فیدبان را خاموش کنید.
- برای حذف، وارد داشبورد Tampermonkey شوید و فیدبان را پاک کنید.

خاموش کردن اسکریپت، کدی را که از قبل در یک تب باز اجرا شده متوقف نمی‌کند. بعد از خاموش کردن، تب‌های باز X را ببندید یا تازه‌سازی کنید.

### اگر چیزی درست کار نمی‌کند

**پنل دیده نمی‌شود**

- مطمئن شوید فیدبان داخل Tampermonkey روشن است.
- مطمئن شوید در `x.com` یا `twitter.com` هستید.
- صفحه را تازه‌سازی کنید.

**عبارت‌ها پیدا می‌شوند ولی ایموجی پیدا نمی‌شود**

- مطمئن شوید ایموجی داخل نام نمایشی یا بیوی قابل‌مشاهده است.
- کد نصب‌شده را با جدیدترین نسخه فایل `feedban.user.js` جایگزین کنید.
- ذخیره را بزنید و X را تازه‌سازی کنید.

**حساب رنگی می‌شود ولی بلاک نمی‌شود**

- مطمئن شوید Dry Run خاموش است.
- ممکن است X منوهایش را تغییر داده باشد یا گزینه بلاک در آن کارت وجود نداشته باشد.
- دلیل ثبت‌شده را در Recent activity ببینید.

**X کند می‌شود یا روی لوگوی شروع می‌ماند**

- فیدبان را خاموش کنید.
- تب گیرکرده X را کامل ببندید.
- X را در یک تب جدید باز کنید.
- قبل از روشن کردن دوباره، مطمئن شوید جدیدترین نسخه فیدبان را دارید.

پیام‌های کنسول مرورگر درباره تبلیغات، Content Security Policy یا `beforeinstallprompt` معمولاً مربوط به خود X هستند و خطای فیدبان محسوب نمی‌شوند.

### حریم خصوصی

فیدبان داخل مرورگر شما اجرا می‌شود. تنظیمات، فیلترها، شمارنده‌ها و سابقه فعالیت آن توسط افزونه مدیریت اسکریپت ذخیره می‌شوند.

فیدبان توکن ورود X را جمع‌آوری نمی‌کند و فیلترهای شما را به سرور جداگانه‌ای برای فیدبان نمی‌فرستد.
