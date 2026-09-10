const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let promise = null;

/** Loads the Razorpay checkout script once and caches the result. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (promise) return promise;

  promise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => { promise = null; resolve(false); };
    document.body.appendChild(script);
  });

  return promise;
}
