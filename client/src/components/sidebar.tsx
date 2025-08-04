import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Clock,
  BarChart3,
  Play,
  Folder,
  Users,
  FileText,
  Quote,
  File,
  FlaskConical,
  UserCog,
  CreditCard,
  History,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Time Tracking", href: "/time-tracking", icon: Play },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Quotes", href: "/quotes", icon: Quote },
  { name: "Documents", href: "/documents", icon: File },
  { name: "A/B Testing", href: "/ab-testing", icon: FlaskConical },
];

const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: UserCog },
  { name: "Payment Config", href: "/admin/payment-config", icon: CreditCard },
  { name: "Activity Logs", href: "/admin/activity-logs", icon: History },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      {/* Logo and User Info */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">FreelanceTracker</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={user.profileImageUrl || ""} 
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover"
              />
              <AvatarFallback>
                {(user.firstName?.[0] || "") + (user.lastName?.[0] || user.email?.[0] || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        {/* Admin Section */}
        {user?.role === "admin" && (
          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Admin
            </p>
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
