# Task 12.8 + 13.1-13.7: Manual Completion Checklist

> **Status**: Prepared templates and guides for manual completion
> **What's Remaining**: Interactive testing, screenshots, and video recording (requires graphical UI)

---

## ✅ What's Been Done (CLI/Backend Tasks)

- ✅ Created `docs/E2E-TESTING-GUIDE.md` - Step-by-step flow for E2E verification
- ✅ Created `docs/screenshots/README.md` - Screenshot gallery template with all 10 screens
- ✅ Updated root `README.md` with:
  - Screenshots section linking to gallery
  - Demo Video section (with placeholder for URL)
- ✅ Created `docs/screenshots/` directory structure

---

## 🔄 What You Need to Do (Manual Tasks)

### Phase 1: E2E Testing (Task 12.8)

**Prerequisites**:
- Terminal 1: Start backend
- Terminal 2: Start frontend
- Terminal 3 (optional): Monitor logs

**Steps**:

```bash
# Terminal 1: Start PostgreSQL (if not running)
docker-compose up -d postgres

# Terminal 1: Start Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
# Wait until you see: Uvicorn running on http://0.0.0.0:8000

# Terminal 2: Start Frontend
npm run dev --workspace frontend
# Wait until you see: Local: http://localhost:5173
```

**Then**, open browser and complete the **10-Step Flow** (see `docs/E2E-TESTING-GUIDE.md`):

1. ⬜ Register user (test@example.com, ValidPassword123!)
2. ⬜ Login with that user
3. ⬜ Browse home/catalog (verify products load)
4. ⬜ Click product detail (verify images, description, price)
5. ⬜ Add to cart
6. ⬜ Go to cart, verify item is there
7. ⬜ Checkout (fill shipping, select payment)
8. ⬜ See MercadoPago init_point
9. ⬜ Go back to app, view order detail (status = PENDIENTE)
10. ⬜ View order history page

**Document any errors in**: `docs/E2E-TEST-RESULTS.md`

---

### Phase 2: Screenshots (Tasks 13.1-13.2)

**For each of these 10 screens, take a screenshot and save to `docs/screenshots/`:**

| # | File Name | What to Show |
|---|-----------|------------|
| 1 | `01-login.png` | Login page with email/password form |
| 2 | `02-register.png` | Registration form with all fields filled out |
| 3 | `03-catalog.png` | Home/catalog page with product listings, filters |
| 4 | `04-product-detail.png` | Product detail: image, description, price, add to cart button |
| 5 | `05-cart.png` | Shopping cart with items, quantities, total, checkout button |
| 6 | `06-checkout.png` | Checkout: shipping address form, payment method selection |
| 7 | `07-order-detail.png` | Order detail: ID, items, address, status (PENDIENTE/CONFIRMADO) |
| 8 | `08-orders-history.png` | Orders history: list of user's orders |
| 9 | `09-admin-dashboard.png` | Admin dashboard (if available) |
| 10 | `10-admin-orders.png` | Admin orders page OR user profile page |

**Screenshot tips**:
- Use browser DevTools to set resolution to 1920x1080
- Use Windows Snipping Tool, macOS Screenshot, or OBS to capture
- Ensure text is readable, no overlapping windows
- Include real (or realistic fake) data in the screenshots

---

### Phase 3: Screenshots README (Task 13.3)

✅ **Already done**: `docs/screenshots/README.md` is ready with template.

**You just need to**:
1. Verify the 10 PNG files exist in `docs/screenshots/`
2. The table and descriptions are already prepared (no changes needed unless UI differs)

---

### Phase 4: Update Root README (Task 13.4)

✅ **Already done**: `README.md` now includes:
- "## Screenshots" section linking to gallery
- "## Demo Video" section (with placeholder)

**You need to**:
1. Record the demo video (see Phase 5)
2. Upload to YouTube or Google Drive
3. Replace `PLACEHOLDER` in README with actual URL

---

### Phase 5: Record Video Demo (Task 13.5)

**Duration**: ≥3 minutes (smooth, no pauses)

**Flow to record** (pre-plan before recording):

```
00:00-00:30  → Login page, enter credentials (test@example.com / ValidPassword123!), click login
00:30-01:00  → Home page, browse products, show search/filters working
01:00-01:30  → Click a product, view detail page, see images/description/price, click "Add to Cart"
01:30-02:00  → Go to cart, show item added, verify quantity/price, click "Checkout"
02:00-02:30  → Checkout: fill shipping address, select payment method (MercadoPago)
02:30-03:00  → See order confirmation/init_point, navigate to order detail, show order status
03:00+       → (Optional) Show admin dashboard or user profile page
```

**Recording tools**:
- **Windows**: Windows 10/11 Screen Recorder (Win+G)
- **macOS**: QuickTime Player (⌘+Shift+5)
- **Linux/Cross-platform**: OBS Studio (free, recommended)

**Recording tips**:
- Close other windows and tabs
- Set screen to 1920x1080 resolution
- Turn off notifications
- Test audio (if recording voiceover)
- Do a practice run first
- Record in one continuous take (no cuts/edits)
- Keep file format as MP4 or MOV

---

### Phase 6: Upload Video (Task 13.6)

**Option A: YouTube**
1. Go to https://www.youtube.com/upload
2. Upload MP4 file
3. Set to **Unlisted** (not Private)
4. Add title: "Food Store E2E Demo"
5. Add description: "Complete end-to-end flow demonstration of the Food Store e-commerce platform"
6. Get the public URL (e.g., https://youtu.be/ABC123)

**Option B: Google Drive**
1. Upload MP4 to Google Drive
2. Right-click → Share
3. Change permission to "Anyone with the link"
4. Copy the public share link

---

### Phase 7: Update README with Video Link (Task 13.7)

Edit `README.md`:

```markdown
## Demo Video

Watch the complete end-to-end flow demonstration:

🎬 **[View Demo Video](YOUR_URL_HERE)** (≥3 minutes)
```

Replace `YOUR_URL_HERE` with:
- YouTube: `https://youtu.be/YOUR_VIDEO_ID`
- Google Drive: Direct share link

---

## Verification Checklist

Before declaring tasks complete:

### Task 12.8: E2E Flow ✅
- [ ] All 10 steps completed without errors
- [ ] Screenshots taken for problematic areas (if any issues)
- [ ] Results documented in `docs/E2E-TEST-RESULTS.md`

### Task 13.1-13.2: Screenshots ✅
- [ ] 10 PNG files in `docs/screenshots/`:
  - [ ] 01-login.png
  - [ ] 02-register.png
  - [ ] 03-catalog.png
  - [ ] 04-product-detail.png
  - [ ] 05-cart.png
  - [ ] 06-checkout.png
  - [ ] 07-order-detail.png
  - [ ] 08-orders-history.png
  - [ ] 09-admin-dashboard.png
  - [ ] 10-admin-orders.png

### Task 13.3: Screenshots README ✅
- [ ] `docs/screenshots/README.md` exists
- [ ] Table with all 10 screenshots
- [ ] Descriptions accurate for your implementation

### Task 13.4: Update README (Screenshots) ✅
- [ ] Root `README.md` has "## Screenshots" section
- [ ] Link to `docs/screenshots/README.md` works

### Task 13.5: Video Demo ✅
- [ ] Video recorded (≥3 minutes)
- [ ] Smooth flow, no long pauses
- [ ] File format: MP4 or MOV
- [ ] Resolution: 1920x1080 minimum

### Task 13.6: Upload Video ✅
- [ ] Video uploaded to YouTube (Unlisted) OR Google Drive (Public)
- [ ] Public URL obtained
- [ ] URL is accessible (test in incognito window)

### Task 13.7: Update README (Video) ✅
- [ ] Root `README.md` has "## Demo Video" section
- [ ] Video URL replaced with actual link
- [ ] Link is active and works

---

## Git Commit Message

After all tasks complete:

```bash
git add .
git commit -m "docs(e2e): complete E2E flow verification + screenshots + video demo (tasks 12.8, 13.1-13.7)"
git push
```

---

## If You Encounter Errors

**Backend Issues**:
- Check logs in `backend/` terminal
- Look for 400/500 errors
- Verify PostgreSQL is running: `docker-compose ps`

**Frontend Issues**:
- Check browser console (F12)
- Look for network errors
- Verify backend is running: http://localhost:8000/docs

**Validation Errors**:
- Email format must be valid
- Password must meet requirements (check backend validation)
- All required fields must be filled

**Payment Integration**:
- Use MercadoPago sandbox credentials (if available)
- Do NOT complete actual payment in demo
- Just show the init_point/checkout page

---

## Support

- **E2E Guide**: See `docs/E2E-TESTING-GUIDE.md` for detailed step descriptions
- **Screenshots Gallery**: See `docs/screenshots/README.md` for what each screenshot should show
- **API Testing**: Use `http://localhost:8000/docs` (Swagger UI) to test endpoints directly
- **Logs**: Check `frontend/` and `backend/` terminal outputs for errors

---

**Ready?** Start with Phase 1: E2E Testing! 🚀
