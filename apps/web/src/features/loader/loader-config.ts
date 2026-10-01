export const BRAND_INTRO_SESSION_KEY = "akb-brand-intro-v1";

export function shouldShowBrandIntro({
  seen,
  reducedMotion,
  saveData,
}: {
  seen: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}): boolean {
  return !seen && !reducedMotion && !saveData;
}

export function createBrandIntroBootstrapScript(): string {
  return `(function(){try{var root=document.documentElement;delete root.dataset.akbBrandIntro;var key=${JSON.stringify(BRAND_INTRO_SESSION_KEY)};var seen=sessionStorage.getItem(key)==='1';var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;var saveData=Boolean(connection&&connection.saveData);if(!seen&&!reduced&&!saveData){root.dataset.akbBrandIntro='visible';sessionStorage.setItem(key,'1');}}catch(error){delete document.documentElement.dataset.akbBrandIntro;}})();`;
}
