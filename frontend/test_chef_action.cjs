const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[PAGE LOG ${msg.type()}]`, msg.text()));
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'chef@foodstore.com');
  await page.type('input[type="password"]', 'ChefPass123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Wait for orders to load
  await page.waitForTimeout(2000);
  
  // Expand the first order
  const expandBtn = await page.$('.order-card-header');
  if (expandBtn) {
    await expandBtn.click();
    console.log("Clicked to expand order");
    await page.waitForTimeout(1000);
    
    // Find the primary button (Start Prep or Ready)
    const actionBtn = await page.$('.btn-primary');
    if (actionBtn) {
      const btnText = await page.evaluate(el => el.textContent, actionBtn);
      console.log(`Clicking action button: ${btnText}`);
      await actionBtn.click();
      
      // Wait to see if it succeeds
      await page.waitForTimeout(2000);
      
      // Check for errors
      const errorMsg = await page.$eval('.error-message', el => el.textContent).catch(() => null);
      if (errorMsg) {
        console.log(`ERROR: Action failed with message: ${errorMsg}`);
      } else {
        console.log("SUCCESS: Action completed without errors.");
      }
    } else {
      console.log("No action button found.");
    }
  } else {
    console.log("No orders found.");
  }
  
  await browser.close();
})();
