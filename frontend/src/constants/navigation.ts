export interface NavItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/explore', label: 'Explore' },
  { href: '/plan', label: 'Plan Trip' },
  { href: '/safety', label: 'Safety' },
  { href: '/map', label: 'Map' },
  { href: '/policies', label: 'Policies' },
];
