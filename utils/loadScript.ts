export default function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    s.async = true;
    s.onerror = reject;
    s.onload = resolve;
    document.body.appendChild(s);
  });
}
