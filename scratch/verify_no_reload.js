const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUploadFailure() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Login
  console.log('Logging in...');
  await page.goto('http://localhost:9002/login');
  // Use dev auth to login as dustin
  await page.goto('http://localhost:9002/api/dev-login?userId=user_28'); // user_28 is dustin in seed
  await page.waitForURL('**/your-comms');

  console.log('On YourComms page.');

  // 2. Mock /api/upload to fail with 500
  await page.route('**/api/upload', route => {
    console.log('Intercepting /api/upload - returning 500');
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'MOCKED UPLOAD FAILURE' })
    });
  });

  // 3. Open ComposeBox
  await page.click('button:has-text("What do you have to share?")');
  await page.fill('textarea', 'Test post with failing upload');

  // 4. Attach an image
  const filePath = path.join(__dirname, 'test.png');
  fs.writeFileSync(filePath, 'dummy image content');
  await page.setInputFiles('input[type="file"]', filePath);

  // Wait for preview
  await page.waitForSelector('img[alt^="Preview"]');
  console.log('Image attached and preview visible.');

  // 5. Click Post
  console.log('Clicking Post...');
  await page.click('button:has-text("Post")');

  // 6. Verify no reload
  // Wait for the toast to appear
  try {
    await page.waitForSelector('text=MOCKED UPLOAD FAILURE', { timeout: 5000 });
    console.log('Error toast found!');
  } catch (e) {
    console.log('Error toast NOT found - check if page reloaded.');
  }

  // Check if content is still there (if it reloaded, it would be gone)
  const content = await page.inputValue('textarea');
  if (content === 'Test post with failing upload') {
    console.log('SUCCESS: Page did not reload, content preserved.');
  } else {
    console.error('FAILURE: Page reloaded or content cleared!');
  }

  // Cleanup
  fs.unlinkSync(filePath);
  await browser.close();
}

testUploadFailure().catch(console.error);
