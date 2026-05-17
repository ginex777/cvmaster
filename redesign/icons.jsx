// Lucide-style icon set for Hireflow redesign mockups.
// 16/20px viewBox, currentColor stroke, strokeWidth 1.5, round caps/joins.
// Export to window so other Babel scripts can use them.

const Icon = ({ d, size = 16, fill, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill || 'none'}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  Home:        (p) => <Icon {...p} d={<><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/></>} />,
  File:        (p) => <Icon {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></>} />,
  Briefcase:   (p) => <Icon {...p} d={<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></>} />,
  Columns:     (p) => <Icon {...p} d={<><rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="10" y="4" width="6" height="16" rx="1.5"/><rect x="17" y="4" width="4" height="16" rx="1.5"/></>} />,
  Linkedin:    (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></>} />,
  Settings:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>} />,
  Logout:      (p) => <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>} />,
  Plus:        (p) => <Icon {...p} d="M12 5v14M5 12h14"/>,
  Search:      (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  Download:    (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>} />,
  Sparkles:    (p) => <Icon {...p} d={<><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.5l-1.7-4.5L6 9.3l4.3-1.7L12 3z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/><path d="M5 16l.6 1.5L7 18l-1.4.5L5 20l-.6-1.5L3 18l1.4-.5L5 16z"/></>} />,
  Bell:        (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  Mail:        (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} />,
  Link:        (p) => <Icon {...p} d={<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17"/></>} />,
  Calendar:    (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>} />,
  Building:    (p) => <Icon {...p} d={<><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M9 11h2M9 15h2M13 7h2M13 11h2M13 15h2M10 21v-3h4v3"/></>} />,
  User:        (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>} />,
  Lock:        (p) => <Icon {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} />,
  Target:      (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>} />,
  Alert:       (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></>} />,
  Copy:        (p) => <Icon {...p} d={<><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>} />,
  Refresh:     (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>} />,
  Filter:      (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4z"/>,
  Grid:        (p) => <Icon {...p} d={<><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></>} />,
  Command:     (p) => <Icon {...p} d={<><path d="M15 9h-3V6a3 3 0 1 1 3 3z"/><path d="M9 9h3V6a3 3 0 1 0-3 3z"/><path d="M9 15h3v3a3 3 0 1 1-3-3z"/><path d="M15 15h-3v3a3 3 0 1 0 3-3z"/></>} />,
  ChevronDown: (p) => <Icon {...p} d="m6 9 6 6 6-6"/>,
  ChevronRight:(p) => <Icon {...p} d="m9 6 6 6-6 6"/>,
  ChevronLeft: (p) => <Icon {...p} d="m15 6-6 6 6 6"/>,
  Check:       (p) => <Icon {...p} d="m5 12 5 5 9-11"/>,
  X:           (p) => <Icon {...p} d="M6 6l12 12M18 6 6 18"/>,
  More:        (p) => <Icon {...p} d={<><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></>} />,
  TrendUp:     (p) => <Icon {...p} d={<><path d="M3 17 9 11l4 4 8-9"/><path d="M14 6h7v7"/></>} />,
  Upload:      (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>} />,
  Doc:         (p) => <Icon {...p} d={<><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></>} />,
  Layers:      (p) => <Icon {...p} d={<><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/></>} />,
  Eye:         (p) => <Icon {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  Send:        (p) => <Icon {...p} d={<><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></>} />,
  Star:        (p) => <Icon {...p} d="M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.4L12 17.3 6.4 20.4l1.5-6.4L3 9.8l6.4-.5L12 3z"/>,
  Sun:         (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></>} />,
  ArrowRight:  (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6"/>,
  Drag:        (p) => <Icon {...p} d={<><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></>} />,
  Globe:       (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></>} />,
  Pin:         (p) => <Icon {...p} d={<><path d="M12 21V13"/><path d="M9 13h6l1-2-4-6h-1L7 11l2 2z"/></>} />,
};

Object.assign(window, { I, Icon });
