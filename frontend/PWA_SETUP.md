# PWA Setup Guide - Amharic Literacy Portal

## ✅ What's Been Implemented

### 1. Vite PWA Plugin
- Installed and configured `vite-plugin-pwa`
- Auto-update service worker registration
- Workbox caching strategies

### 2. Web App Manifest
- App name: "Amharic Literacy Portal"
- Theme color: Blue (#3b82f6)
- Standalone display mode
- Portrait orientation

### 3. Offline Detection
- `useOnlineStatus` hook - Detects connection status
- `OfflineBanner` component - Shows offline/online status
- Automatic notifications when connection changes

### 4. Caching Strategy

**Static Assets** (CacheFirst):
- HTML, CSS, JavaScript files
- Images, fonts, icons

**Audio Files** (CacheFirst):
- Fidel alphabet audio files
- Cached for 30 days
- Up to 250 files

**API Calls** (NetworkFirst):
- Fresh data when online
- Cached fallback when offline
- 5-minute cache expiration

**Google Fonts** (CacheFirst):
- Abyssinica SIL font
- Cached for 1 year

## 📱 Features

### Installable
Users can install the app on:
- Android devices (Add to Home Screen)
- iOS devices (Add to Home Screen)
- Desktop (Chrome, Edge - Install button in address bar)

### Offline Capable
Works offline for:
- ✅ Fidel alphabet chart
- ✅ Cached audio pronunciations
- ✅ Previously viewed lessons
- ✅ Static content
- ❌ New API data (requires connection)
- ❌ Login/authentication (requires connection)

### Fast Loading
- Instant loading after first visit
- Cached assets load immediately
- Background updates for new content

## 🎨 Icons Needed

You need to create two icon files in `frontend/public/`:

### icon-192.png (192x192 pixels)
- Used for Android home screen
- Used in app switcher
- Recommended: Blue background with white Amharic character

### icon-512.png (512x512 pixels)
- Used for splash screen
- Used in app stores
- Same design as 192px version

### How to Create Icons:

**Option 1: Online Tool**
1. Go to https://realfavicongenerator.net/
2. Upload your logo/design
3. Download generated icons
4. Place in `frontend/public/`

**Option 2: Design Tool**
1. Use Figma, Canva, or Photoshop
2. Create 512x512px canvas
3. Design with your branding
4. Export as PNG
5. Resize to 192x192px for smaller version

**Suggested Design:**
- Background: #3b82f6 (blue)
- Icon: White Amharic character (ሀ or አ)
- Or: Your app logo
- Keep it simple and recognizable

## 🧪 Testing

### Test Installation:
1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open in Chrome
4. Look for install button in address bar
5. Click to install

### Test Offline Mode:
1. Open app in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Select "Offline" from throttling dropdown
5. Refresh page - app should still work
6. Try navigating to Fidel Chart page

### Test Service Worker:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in sidebar
4. Should see registered service worker
5. Check "Cache Storage" to see cached files

## 🚀 Deployment

### Build for Production:
```bash
cd frontend
npm run build
```

### What Gets Generated:
- `dist/` folder with optimized files
- Service worker file
- Web app manifest
- Precached assets list

### Deploy To:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting

**Important:** Must be served over HTTPS for PWA features to work (except localhost).

## 📊 PWA Checklist

- [x] Web App Manifest configured
- [x] Service Worker registered
- [x] HTTPS (required for production)
- [x] Responsive design
- [x] Offline fallback
- [x] Icons (192px and 512px) - **YOU NEED TO ADD THESE**
- [x] Theme color
- [x] Installable
- [x] Fast loading

## 🔧 Configuration

### Update App Name:
Edit `frontend/vite.config.js`:
```javascript
manifest: {
  name: 'Your App Name',
  short_name: 'Short Name',
  // ...
}
```

### Update Theme Color:
Edit `frontend/vite.config.js`:
```javascript
manifest: {
  theme_color: '#your-color',
  // ...
}
```

### Adjust Cache Duration:
Edit `frontend/vite.config.js`:
```javascript
workbox: {
  runtimeCaching: [
    {
      // ... adjust maxAgeSeconds
    }
  ]
}
```

## 🐛 Troubleshooting

### Service Worker Not Updating:
1. Clear browser cache
2. Unregister old service worker in DevTools
3. Hard refresh (Ctrl+Shift+R)

### Icons Not Showing:
1. Check files exist in `public/` folder
2. Check file names match exactly
3. Clear cache and reinstall

### Offline Mode Not Working:
1. Check service worker is registered
2. Check cache storage in DevTools
3. Ensure you visited pages while online first

## 📚 Resources

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://web.dev/add-manifest/)

## ⚠️ Important Notes

1. **Icons Required**: You must add icon-192.png and icon-512.png to the public folder
2. **HTTPS Required**: PWA features only work on HTTPS (except localhost)
3. **First Visit**: User must visit while online first to cache content
4. **Updates**: Service worker auto-updates when you deploy new version
5. **Testing**: Use Chrome DevTools for best PWA testing experience
