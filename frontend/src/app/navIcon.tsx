import { IconType } from "react-icons";
import { FaPlane, FaHotel, FaReceipt } from "react-icons/fa";

export interface NavItem {
  label: string;
  href: string;
  Icon: IconType;
}

export const navItems: NavItem[] = [
  { label: "Flights",  href: "/flights",  Icon: FaPlane },
  { label: "Hotels",   href: "/hotels",   Icon: FaHotel },
  { label: "Bookings", href: "/bookings", Icon: FaReceipt },
];
