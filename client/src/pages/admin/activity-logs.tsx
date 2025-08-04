import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Activity, User, FileText, Clock, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/activity-logs", { limit: 100 }],
    retry: false,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const getUserName = (userId: string) => {
    const userItem = users?.find((u: any) => u.id === userId);
    if (!userItem) return "Unknown User";
    
    if (userItem.firstName && userItem.lastName) {
      return `${userItem.firstName} ${userItem.lastName}`;
    }
    return userItem.email || "Unknown User";
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <FileText className="w-4 h-4 text-green-600" />;
    if (action.includes('update') || action.includes('edit')) return <Settings className="w-4 h-4 text-blue-600" />;
    if (action.includes('delete')) return <Settings className="w-4 h-4 text-red-600" />;
    if (action.includes('timer') || action.includes('time')) return <Clock className="w-4 h-4 text-purple-600" />;
    if (action.includes('user')) return <User className="w-4 h-4 text-yellow-600" />;
    return <Activity className="w-4 h-4 text-slate-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'outline';
    if (action.includes('update') || action.includes('edit')) return 'default';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('timer') || action.includes('time')) return 'secondary';
    return 'secondary';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredLogs = activityLogs?.filter((log: any) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(log.userId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  }) || [];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Activity Logs</h2>
              <p className="text-sm text-slate-500">Monitor user activity and system events</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search activity logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="timer">Timer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getActionIcon(log.action)}
                            <div>
                              <Badge variant={getActionColor(log.action)} className="text-xs">
                                {formatAction(log.action)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {getUserName(log.userId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.entityType ? (
                            <Badge variant="outline" className="capitalize">
                              {log.entityType.replace('_', ' ')}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.details ? (
                            <div className="text-sm text-slate-600 max-w-xs truncate">
                              {typeof log.details === 'object' 
                                ? Object.entries(log.details).map(([key, value]) => 
                                    `${key}: ${value}`
                                  ).join(', ')
                                : String(log.details)
                              }
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {log.ipAddress || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.createdAt).toLocaleDateString()}
                            <div className="text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No activity logs found</p>
                  <p className="text-sm">Activity will appear here as users interact with the system</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
