export function isInAppBrowser(): boolean {
  if (typeof window === "undefined" || !window.navigator) {
    return false;
  }
  const ua = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
  
  // Zalo
  if (ua.includes("Zalo")) return true;
  
  // Facebook/Messenger
  if (ua.includes("FBAN") || ua.includes("FBAV") || ua.includes("MessengerForiOS")) return true;
  
  // Instagram
  if (ua.includes("Instagram")) return true;
  
  // TikTok
  if (ua.includes("TikTok")) return true;
  
  // Line
  if (ua.includes("Line")) return true;
  
  return false;
}
