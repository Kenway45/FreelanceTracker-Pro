import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import TimerWidget from "@/components/timer-widget";
import { 
  Clock, 
  Folder, 
  FileText, 
  DollarSign, 
  Play, 
  Plus, 
  FolderPlus, 
  Quote,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  History,
  CreditCard
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: activeTimer } = useQuery({
    queryKey: ["/api/time-entries/active"],
    refetchInterval: 1000, // Update every second
    retry: false,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/activity-logs", { limit: 10 }],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
              <p className="text-sm text-slate-500">Welcome back! Here's what's happening with your projects.</p>
            </div>
            <div className="flex items-center space-x-4">
              <TimerWidget activeTimer={activeTimer} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.weeklyHours || "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.activeProjects || "0"}
                </div>
                <p className="text-xs text-muted-foreground">+2 new this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${statsLoading ? "..." : stats?.pendingInvoices || "0.00"}
                </div>
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${statsLoading ? "..." : stats?.monthlyRevenue || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Start Time Tracking
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Quote className="mr-2 h-4 w-4" />
                  Generate Quote
                </Button>
                <Link href="/checkout">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Test Cashfree Payment
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded animate-pulse" />
                          <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          {activity.action === 'create_invoice' && <FileText className="h-4 w-4 text-green-600" />}
                          {activity.action === 'start_timer' && <Clock className="h-4 w-4 text-blue-600" />}
                          {activity.action === 'create_project' && <Folder className="h-4 w-4 text-purple-600" />}
                          {activity.action === 'create_client' && <Users className="h-4 w-4 text-yellow-600" />}
                          {!['create_invoice', 'start_timer', 'create_project', 'create_client'].includes(activity.action) && 
                            <History className="h-4 w-4 text-slate-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {activity.action.replace('_', ' ')} 
                            {activity.entityType && ` - ${activity.entityType}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Timer Display */}
          {activeTimer && (
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3" />
                  Active Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{activeTimer.description || "Time tracking session"}</p>
                    <p className="text-sm text-slate-600">
                      Started at {new Date(activeTimer.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-slate-900">
                      {Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / (1000 * 60 * 60))}:
                      {Math.floor(((Date.now() - new Date(activeTimer.startTime).getTime()) % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')}:
                      {Math.floor(((Date.now() - new Date(activeTimer.startTime).getTime()) % (1000 * 60)) / 1000).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">Project deliverables due</h4>
                    <p className="text-sm text-slate-600">Final review and handoff</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">Tomorrow</p>
                    <p className="text-xs text-slate-500">{new Date(Date.now() + 86400000).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">Client presentation</h4>
                    <p className="text-sm text-slate-600">Prototype review meeting</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600">3 days</p>
                    <p className="text-xs text-slate-500">{new Date(Date.now() + 259200000).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
