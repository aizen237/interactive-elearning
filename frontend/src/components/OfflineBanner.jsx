import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

/**
 * OfflineBanner Component
 * 
 * Displays a banner when the user goes offline and a success message when back online
 */
function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }

    if (isOnline && wasOffline) {
      // Show "back online" message briefly
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show "Back Online" message
  if (showOnlineMessage) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-3 px-4 shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <Wifi className="w-5 h-5" />
          <span className="font-semibold">You're back online!</span>
        </div>
      </div>
    );
  }

  // Show "Offline" banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-gray-900 py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <WifiOff className="w-5 h-5" />
          <div className="text-center">
            <span className="font-semibold">You're offline</span>
            <p className="text-sm">Some features may be limited. Cached content is still available.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default OfflineBanner;
