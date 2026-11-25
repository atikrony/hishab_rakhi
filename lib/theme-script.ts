export const THEME_STORAGE_KEY = 'hr-theme';

/**
 * Inline script run in <head> before first paint so the saved (or system)
 * theme is applied without a light-mode flash.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`;
