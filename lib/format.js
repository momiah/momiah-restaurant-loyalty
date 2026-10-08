export const gbp = (n) => "£" + (Number(n) || 0).toFixed(2);
export const num = (n) => (Number(n) || 0).toLocaleString("en-GB");
