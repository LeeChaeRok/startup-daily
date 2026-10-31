// Inline line icons (24px grid, 1.75 stroke). Decorative by default;
// pass `label` to expose to assistive tech.
const PATHS = {
  today: <><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" /><path d="M8 14h3" /></>,
  explore: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  bookmark: <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />,
  bookmarkFill: <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" fill="currentColor" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.4" /></>,
  share: <><path d="M12 3.5v11M7.5 8 12 3.5 16.5 8" /><path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  back: <path d="M15 5 8 12l7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  chevronUp: <path d="m5 15 7-7 7 7" />,
  image: <><rect x="4" y="4.5" width="16" height="15" rx="1.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4.5 17.5 5-5 4 4 2.5-2.5 3.5 3.5" /></>,
  external: <><path d="M14 4.5h5.5V10M19.5 4.5 11 13" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12.5" rx="1.5" /><path d="M8.5 20.5h7M12 16.5v4" /></>,
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  download: <><path d="M12 3.5v11M7.5 10 12 14.5 16.5 10" /><path d="M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16" /></>,
  copy: <><rect x="8" y="8" width="12.5" height="12.5" rx="1.5" /><path d="M16 8V5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5v9.5A1.5 1.5 0 0 0 5.5 16H8" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><path d="M12 3.5 2.5 20h19z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.8c1.6.6 2.7 2.2 3 4.7" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  spark: <path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  more: <path d="M12 5.5v.01M12 12v.01M12 18.5v.01" strokeWidth="2.75" />,
  trendingUp:<><path d="m3.5 17 6-6 4 4 7-7.5" /><path d="M15 7.5h5.5V13" /></>,
}

export default function Icon({ name, size = 20, label, className = '', strokeWidth = 1.75 }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
