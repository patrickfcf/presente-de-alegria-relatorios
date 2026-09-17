const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  calendar: "M4 5h16v16H4ZM8 2v6M16 2v6M4 11h16",
  news: "M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  file: "M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6",
  logout: "M9 4H4v16h5M9 12h12m-5-5 5 5-5 5",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  heart: "M20 5c-3-3-7 0-8 2-1-2-5-5-8-2-5 5 3 11 8 15 5-4 13-10 8-15Z",
  users:
    "M16 21v-3c0-3-3-4-6-4s-6 1-6 4v3M14 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 3c4 0 4 7 0 7m1 4c3 1 3 3 3 7",
  pin: "M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
};
export function Icon({
  name,
  size = 22,
}: {
  name: keyof typeof paths;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
