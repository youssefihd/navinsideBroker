import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  LogOut, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  username?: string;
  email?: string;
}

export function Navbar({ username = 'John Doe', email = 'user@example.com' }: NavbarProps) {
  const [user, setUser] = useState({ username, email });
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang).then(() => {
      console.log('Language changed to:', i18n.language);
    });
  };
  
  useEffect(() => {
    // Optional: Replace with actual user endpoint if available
    api.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => {}); // fallback to props if request fails
  }, []);

  return (
    
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-white px-4 sm:px-6">
     <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="flex items-center gap-2">
      🌐 {i18n.language === 'fr' ? 'Français' : 'English'}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem
      onClick={() => i18n.changeLanguage('en')}
      className="cursor-pointer flex items-center gap-2"
    >
      🇺🇸 English
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => i18n.changeLanguage('fr')}
      className="cursor-pointer flex items-center gap-2"
    >
      🇫🇷 Français
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full flex items-center justify-center">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-logistics-100 text-logistics-700">
                  {user.username.split(' ').map(name => name[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
              }}
              className="flex cursor-pointer items-center text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    
  );
}
