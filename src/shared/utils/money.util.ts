export const paiseToRupeeString = (paise: number): string => {
  if (typeof paise !== "number" || isNaN(paise)) {
    return "0.00";
  }
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.trunc(paise));
  const paiseStr = absPaise.toString().padStart(3, "0");
  const rupees = paiseStr.slice(0, -2);
  const cents = paiseStr.slice(-2);
  return `${isNegative ? "-" : ""}${rupees}.${cents}`;
};

export const formatRupees = (paise: number): string => {
  return `₹${paiseToRupeeString(paise)}`;
};

export const rupeeStringToPaise = (input: string | number): number => {
  if (typeof input === "number") {
    if (isNaN(input)) return 0;
    input = input.toString();
  }
  let str = input.trim();
  if (!str) return 0;
  str = str.replace(/[₹$,\s]/g, "");
  const isNegative = str.startsWith("-");
  if (isNegative) {
    str = str.slice(1);
  }
  const parts = str.split(".");
  const rupeesPart = parts[0] || "0";
  let paisePart = (parts[1] || "").slice(0, 2);
  while (paisePart.length < 2) {
    paisePart += "0";
  }
  const rupeesInt = parseInt(rupeesPart, 10) || 0;
  const paiseInt = parseInt(paisePart, 10) || 0;
  const total = rupeesInt * 100 + paiseInt;
  return isNegative ? -total : total;
};
