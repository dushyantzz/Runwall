import {
  type LucideIcon,
  Home,
  Shield,
  Lock,
  Key,
  AlertTriangle,
  Scale,
  CheckSquare,
  FileText,
  Plug,
  ScrollText,
  FileCode,
  BookOpen,
  Settings,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  onClick?: () => void;
  sectionEnd?: boolean;
}

export const mainMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'governance',
    label: 'Governance',
    href: '/dashboard/governance',
    icon: Shield,
  },
  {
    id: 'identity',
    label: 'Identity',
    href: '/dashboard/identity',
    icon: Lock,
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
    sectionEnd: true,
  },
  {
    id: 'risk',
    label: 'Risk & Taint',
    href: '/dashboard/risk',
    icon: AlertTriangle,
  },
  {
    id: 'quotas',
    label: 'Quotas',
    href: '/dashboard/quotas',
    icon: Scale,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
  },
  {
    id: 'contracts',
    label: 'Contracts',
    href: '/dashboard/contracts',
    icon: FileText,
  },
  {
    id: 'connectors',
    label: 'Connectors',
    href: '/dashboard/connectors',
    icon: Plug,
    sectionEnd: true,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    href: '/dashboard/audit',
    icon: ScrollText,
  },
  {
    id: 'policies',
    label: 'Policies (OPA)',
    href: '/dashboard/policies',
    icon: FileCode,
  },
];

export const bottomMenuItems: MenuItem[] = [
  {
    id: 'docs',
    label: 'Documentation',
    href: '/dashboard/docs',
    icon: BookOpen,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '',
    icon: Settings,
  },
];
