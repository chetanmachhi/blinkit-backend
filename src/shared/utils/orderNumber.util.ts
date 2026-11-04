export const generateOrderNumber = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `ORD-${yy}${mm}${dd}-${random}`;
};
