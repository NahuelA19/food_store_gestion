const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  // Get all style tags content
  const styles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('style')).map(s => s.textContent).filter(t => t.includes('background-image') || t.includes('fondo'));
  });
  
  console.log("Styles:", styles);
  await browser.close();
})();
