# How to Preview the Frontend Application

## Quick Start (3 Steps)

### 1. Navigate to the frontend directory
```bash
cd /home/engine/project/frontend
```

### 2. Install dependencies (first time only)
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

You should see output like:
```
VITE v7.2.7  ready in 295 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Open in Browser
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## What You'll See

### 1. Search Application Header
- Clean, centered header with "Search Application" title

### 2. Search Bar
- Accessible search input with placeholder text
- Search button that enables when you type
- Clear button (X) appears when there's text

### 3. Search Functionality
**Note:** Since there's no backend API yet, searches will show error messages. This is expected behavior!

You can still interact with the UI to see:
- Loading spinner while "searching"
- Error banner with retry and dismiss buttons
- Proper error handling

### 4. Interactive Features

Try these interactions:
- **Type in search bar** → See the search button enable
- **Click the X button** → Clear the search
- **Press Tab** → Navigate through elements
- **Press Enter** → Submit search
- **Click Retry** → Re-attempt the search
- **Click Dismiss** → Clear the error

### 5. Responsive Design
- Resize your browser window to see responsive layout changes
- Works on mobile, tablet, and desktop sizes

---

## Testing the Application

### Run All Tests
```bash
npm test
```

Expected output: **35 tests pass**

### Run Tests with UI
```bash
npm run test:ui
```

Opens an interactive test runner in your browser.

### Check Code Quality
```bash
# Lint check
npm run lint

# Format check
npm run format:check
```

---

## Building for Production

### Create Production Build
```bash
npm run build
```

Output will be in `frontend/dist/`

### Preview Production Build
```bash
npm run preview
```

Opens the production build at [http://localhost:4173](http://localhost:4173)

---

## Connecting to a Backend

To connect to an actual backend API:

1. Create a `.env` file:
```bash
cp .env.example .env
```

2. Edit `.env` and set your API URL:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Restart the dev server:
```bash
npm run dev
```

### API Requirements

The application expects these endpoints:

- `GET /search?query=<term>&limit=<num>` - Search endpoint
  - Returns: `SearchResult[]`
  
- `GET /search/:id` - Get by ID
  - Returns: `SearchResult`

#### SearchResult Type
```typescript
{
  id: string
  title: string
  description: string
  url?: string
}
```

---

## Keyboard Shortcuts in Dev Mode

- **Press `h`** - Show Vite help menu
- **Press `r`** - Restart server
- **Press `u`** - Show server URL
- **Press `o`** - Open in browser
- **Press `q`** - Quit server

---

## Accessibility Features

The application is fully accessible:

### Screen Readers
- All interactive elements have ARIA labels
- Status updates announced to screen readers
- Proper heading hierarchy

### Keyboard Navigation
- **Tab** - Move through elements
- **Enter** - Activate buttons/submit forms
- **Space** - Activate buttons (on player)
- **Escape** - Close player
- **Arrow keys** - Navigate within elements

### Visual
- Clear focus indicators
- High contrast error states
- Responsive text sizing

---

## Troubleshooting

### Port Already in Use
If port 5173 is taken:
```bash
npm run dev -- --port 3000
```

### Dependencies Not Installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.tmp

# Rebuild
npm run build
```

### Tests Failing
```bash
# Clear test cache
npm test -- --clearCache

# Run tests
npm test
```

---

## Demo Without Backend

To see the application in action without a backend:

1. Start the dev server: `npm run dev`
2. Type "test query" in search box
3. Click "Search"
4. See the loading spinner
5. See the error banner appear (network error)
6. Click "Retry" to retry
7. Click "Dismiss" to clear error
8. Try keyboard navigation with Tab key

This demonstrates:
- ✅ Loading states
- ✅ Error handling  
- ✅ Retry functionality
- ✅ Keyboard navigation
- ✅ Accessible interactions

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Modern browsers with ES2022 support required.

---

## Development Tips

### Hot Module Replacement (HMR)
Changes to files automatically update in the browser without full page reload.

### React Fast Refresh
Component state is preserved when editing React components.

### TypeScript Checking
TypeScript errors show in the terminal and browser console.

### Console Logging
Check browser console to see:
- API request/response logs
- Request IDs
- Error details
- Performance timing

---

## Need Help?

1. Check the main [README.md](README.md)
2. Check the detailed [frontend/README.md](frontend/README.md)
3. Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
4. Run tests to verify everything works: `npm test`
