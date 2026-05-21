const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Escuchar logs de la consola
  page.on('console', msg => {
    console.log(`[PAGE LOG ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  // Ir a la app
  await page.goto('http://localhost:5173/login');
  
  // Login como admin
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@foodstore.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Esperar a que entre al dashboard
  await page.waitForNavigation();
  console.log("Logged in");

  // Ir a KDS
  await page.goto('http://localhost:5173/cocina');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log("Done checking");

  await browser.close();
})();
