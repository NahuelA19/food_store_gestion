const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[PAGE LOG ${msg.type()}]`, msg.text()));
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  console.log("Typing chef credentials...");
  await page.type('input[type="email"]', 'chef@foodstore.com');
  await page.type('input[type="password"]', 'ChefPass123');
  
  console.log("Clicking submit...");
  await page.click('button[type="submit"]');
  
  console.log("Waiting for navigation...");
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  const currentUrl = page.url();
  console.log("Landed on URL:", currentUrl);
  
  if (currentUrl.includes('/cocina')) {
    console.log("SUCCESS: Redirected to /cocina");
    
    // Let's also verify that the KDS UI rendered
    const kdsTitle = await page.$eval('.kds-title', el => el.textContent).catch(() => null);
    if (kdsTitle) {
      console.log("SUCCESS: KDS UI rendered with title:", kdsTitle);
    } else {
      console.log("ERROR: KDS UI did not render correctly.");
    }
  } else {
    console.log("ERROR: Did not redirect to /cocina");
  }
  
  await browser.close();
})();
