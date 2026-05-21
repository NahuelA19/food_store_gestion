const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  const styles = await page.evaluate(() => {
    let bgRule = "not found";
    let allRules = [];
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        let sheet = document.styleSheets[i];
        try {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            let rule = sheet.cssRules[j];
            if (rule.selectorText && rule.selectorText.includes('body')) {
               allRules.push({ selector: rule.selectorText, css: rule.cssText });
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
    
    const bodyStyle = window.getComputedStyle(document.body);
    const rootStyle = window.getComputedStyle(document.documentElement);
    return {
      bodyBgImage: bodyStyle.backgroundImage,
      bodyBgColor: bodyStyle.backgroundColor,
      isDark: document.documentElement.classList.contains('dark'),
      rules: allRules
    };
  });
  
  console.log("Styles:", JSON.stringify(styles, null, 2));
  await browser.close();
})();
