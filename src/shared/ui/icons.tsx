/**
 * Inline Lucide-style glyphs, extracted from the components that each had their
 * own private copy (the earth icon alone existed in three files).
 * Markup is identical to the originals; only the size varies per call site.
 */
interface IconProps {
  size?: number;
  className?: string;
}

function Svg({
  size = 18,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function EarthIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-earth"}>
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
      <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
      <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
      <circle cx={12} cy={12} r={10} />
    </Svg>
  );
}

export function NewspaperIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-newspaper"}>
      <path d="M15 18h-5" />
      <path d="M18 14h-8" />
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="10" y="6" rx="1" />
    </Svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-sparkles"}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx={4} cy={20} r={2} />
    </Svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-bookmark"}>
      <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
    </Svg>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-thumbs-up"}>
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      <path d="M7 10v12" />
    </Svg>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-message-circle"}>
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </Svg>
  );
}

export function Repeat2Icon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-repeat-2"}>
      <path d="m2 9 3-3 3 3" />
      <path d="M13 18H7a2 2 0 0 1-2-2V6" />
      <path d="m22 15-3 3-3-3" />
      <path d="M11 6h6a2 2 0 0 1 2 2v10" />
    </Svg>
  );
}

export function Share2Icon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-share-2"}>
      <circle cx={18} cy={5} r={3} />
      <circle cx={6} cy={12} r={3} />
      <circle cx={18} cy={19} r={3} />
      <line x1={8.59} x2={15.42} y1={13.51} y2={17.49} />
      <line x1={15.41} x2={8.59} y1={6.51} y2={10.49} />
    </Svg>
  );
}

export function EllipsisIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-ellipsis"}>
      <circle cx={12} cy={12} r={1} />
      <circle cx={19} cy={12} r={1} />
      <circle cx={5} cy={12} r={1} />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-pencil"}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-trash2 lucide-trash-2"}>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-x"}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-triangle-alert"}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-arrow-left"}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-image"}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx={9} cy={9} r={2} />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Svg>
  );
}

export function SmileIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-smile"}>
      <circle cx={12} cy={12} r={10} />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1={9} x2={9.01} y1={9} y2={9} />
      <line x1={15} x2={15.01} y1={9} y2={9} />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-send"}>
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-clock3 lucide-clock-3"}>
      <path d="M12 6v6h4" />
      <circle cx={12} cy={12} r={10} />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-users"}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx={9} cy={7} r={4} />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-search"}>
      <path d="m21 21-4.34-4.34" />
      <circle cx={11} cy={11} r={8} />
    </Svg>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "lucide lucide-user-plus"}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <line x1={19} x2={19} y1={8} y2={14} />
      <line x1={22} x2={16} y1={11} y2={11} />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </Svg>
  );
}
