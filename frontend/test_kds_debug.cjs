const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[PAGE CRASH] ${err.message}\n${err.stack}`);
  });

  page.on('requestfailed', req => {
    networkErrors.push(`[NETWORK FAIL] ${req.method()} ${req.url()} → ${req.failure().errorText}`);
  });

  page.on('response', async res => {
    if (!res.ok() && res.url().includes('localhost:8000')) {
      let body = '';
      try { body = await res.text(); } catch(_) {}
      networkErrors.push(`[API ERROR] ${res.request().method()} ${res.url()} → ${res.status()} ${body.substring(0, 300)}`);
    }
  });

  // 1. Login
  console.log("== Step 1: Login ==");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('input[type="email"]', 'cocina@foodstore.com');
  await page.type('input[type="password"]', 'CocinaPass123');
  await page.click('button[type="submit"]');

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log("Navigated to:", page.url());
  } catch(e) {
    console.log("Navigation timed out, current URL:", page.url());
  }

  // 2. Navigate to /cocina if not already there
  if (!page.url().includes('/cocina')) {
    console.log("== Step 2: Going to /cocina ==");
    await page.goto('http://localhost:5173/cocina', { waitUntil: 'networkidle0', timeout: 15000 });
  }
  await page.waitForTimeout(2000);
  console.log("Current URL:", page.url());

  // 3. Check what's on screen
  const pageContent = await page.evaluate(() => {
    const kanban = document.querySelector('.kanban-container');
    const error = document.querySelector('.error-banner');
    const loading = document.querySelector('.loading-state');
    const cards = document.querySelectorAll('.order-card');
    const bodyText = document.body.innerText.substring(0, 500);
    return {
      hasKanban: !!kanban,
      hasError: !!error,
      errorText: error ? error.innerText : null,
      isLoading: !!loading,
      cardCount: cards.length,
      bodyText
    };
  });
  console.log("Page state:", JSON.stringify(pageContent, null, 2));

  // 4. Try expanding a card
  const cards = await page.$$('.order-card-header');
  if (cards.length > 0) {
    console.log(`== Step 4: Expanding card (${cards.length} found) ==`);
    await cards[0].click();
    await page.waitForTimeout(1000);

    const afterExpand = await page.evaluate(() => {
      const body = document.querySelector('.order-card-body');
      const btn = document.querySelector('.btn-primary');
      const errMsg = document.querySelector('.error-message');
      return {
        hasBody: !!body,
        bodyHTML: body ? body.innerHTML.substring(0, 500) : null,
        hasActionBtn: !!btn,
        btnText: btn ? btn.textContent : null,
        errorMessage: errMsg ? errMsg.innerText : null,
      };
    });
    console.log("After expand:", JSON.stringify(afterExpand, null, 2));

    // 5. Try clicking Start Prep
    const actionBtn = await page.$('.action-buttons .btn-primary');
    if (actionBtn) {
      console.log("== Step 5: Clicking action button ==");
      await actionBtn.click();
      await page.waitForTimeout(3000);

      const afterAction = await page.evaluate(() => {
        const errMsg = document.querySelector('.error-message');
        const pageGone = document.body.innerText.length < 20;
        return {
          errorMessage: errMsg ? errMsg.innerText : null,
          pageGone,
          bodyText: document.body.innerText.substring(0, 200),
        };
      });
      console.log("After action:", JSON.stringify(afterAction, null, 2));
    }
  } else {
    console.log("No order cards found on page.");
  }

  // 6. Report errors
  console.log("\n== ERRORS ==");
  if (errors.length === 0 && networkErrors.length === 0) {
    console.log("No errors detected.");
  }
  errors.forEach(e => console.log(e));
  networkErrors.forEach(e => console.log(e));

  await browser.close();
})();
