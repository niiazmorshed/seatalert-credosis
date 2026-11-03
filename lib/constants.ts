export const STATIONS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Cox's Bazar",
] as const;

export const SEAT_CLASSES = [
  "SHOVAN_CHAIR",
  "SNIGDHA",
  "AC_SEAT",
  "AC_BERTH",
  "NON_AC",
  "AC",
] as const;

export const SOURCES = ["Railway", "Shohoz"] as const;

export type Station = (typeof STATIONS)[number];
export type SeatClass = (typeof SEAT_CLASSES)[number];
export type Source = (typeof SOURCES)[number];
