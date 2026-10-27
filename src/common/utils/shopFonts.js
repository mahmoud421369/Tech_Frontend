

export const NB_FONT_STYLE = {
  fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
};
export const AR_FONT_STYLE = {
  fontFamily: "'Cairo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
};


export const getFontStyle = (language) => (language === "ar" ? AR_FONT_STYLE : NB_FONT_STYLE);

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap";

const LANG_CSS = `
  @keyframes langFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .lang-fade { animation: langFade .22s ease-out both; }
  @media (prefers-reduced-motion: reduce) { .lang-fade { animation: none; } }
`;

export const ensureShopAssets = () => {
  if (typeof document === "undefined") return;

  if (!document.getElementById("shop-fonts")) {
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    const link = document.createElement("link");
    link.id = "shop-fonts";
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.append(pre1, pre2, link);
  }

  if (!document.getElementById("shop-lang-css")) {
    const style = document.createElement("style");
    style.id = "shop-lang-css";
    style.textContent = LANG_CSS;
    document.head.appendChild(style);
  }
};