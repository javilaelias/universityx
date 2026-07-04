// Inline script executed before hydration to apply saved theme/lang without flash.
// Must be a Server Component (no 'use client') so it renders in the initial HTML.
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var t=localStorage.getItem('ux-theme');var l=localStorage.getItem('ux-lang');if(t==='dark')document.documentElement.classList.add('dark');if(l)document.documentElement.lang=l;}catch(_){}`,
      }}
    />
  );
}
