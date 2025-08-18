
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Package, 
  Users, 
  Truck, 
  Box, 
  Briefcase, 
  Search,
   DollarSign
} from 'lucide-react';
import { Mail } from 'lucide-react';
import { CheckCheck } from 'lucide-react';


interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  title: string;
  isCollapsed: boolean;
  isActive: boolean;
}

const SidebarLink = ({ to, icon: Icon, title, isCollapsed, isActive }: SidebarLinkProps) => {
  return (
    
    
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all',
        isActive 
          ? 'bg-logistics-600 text-white' 
          : 'text-muted-foreground hover:bg-logistics-50 hover:text-foreground'
      )}
    >
  <Icon size={20} />
      <span className={cn('transition-opacity', 
        isCollapsed ? 'opacity-0 hidden' : 'opacity-100'
      )}>
        {title}
      </span>
    </Link>
  );
};

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();

  const sidebarLinks = [
    { to: '/loads', title: 'Loads', icon: Box },
    { to: '/clients', title: 'Clients', icon: Users },
    { to: '/carriers', title: 'Carriers', icon: Truck },
    { to: '/consignees', title: 'Consignees', icon: Briefcase },
    { to: '/equipments', title: 'Equipments', icon: Package },
    { to: '/shippers', title: 'Shippers', icon: Package },
    { to: '/users', title: 'Users', icon: Users },
    { to: '/emails', title: 'Emails', icon: Mail },
    {
  to: "/accounting",
  title: "Accounting",
  icon:  DollarSign, // Lucide or any other icon system
},   {
  to: "/check",
  title: "Check List",
  icon:  CheckCheck, // Lucide or any other icon system
}
  ];

  return (
  <aside 
    className={cn(
      "h-screen fixed left-0 top-0 z-30 flex flex-col border-r bg-white transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[80px]" : "w-[280px]"
    )}
    onMouseEnter={() => setIsCollapsed(false)}
    onMouseLeave={() => setIsCollapsed(true)}
  >
    <div className="flex h-14 w-auto items-center border-b px-3 py-4">
      <Link to="/" className="flex items-center w-full justify-center overflow-hidden">
        <img
          src="/navinside.jpg"
          alt="NavInside"
          className="h-11 w-auto transition-all duration-300"
        />
      </Link>
    </div>

      <div className="flex-1 overflow-auto py-2 px-3">
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              title={link.title}
              isCollapsed={isCollapsed}
              isActive={location.pathname === link.to}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
