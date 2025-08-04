import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Edit, Trash2, Clock } from "lucide-react";
import NewTimerModal from "@/components/modals/new-timer-modal";

export default function TimeTracking() {
  const [showNewTimerModal, setShowNewTimerModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timeEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/time-entries", selectedProject || undefined],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: activeTimer } = useQuery({
    queryKey: ["/api/time-entries/active"],
    refetchInterval: 1000,
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (timerId: string) => {
      await apiRequest("PUT", `/api/time-entries/${timerId}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Timer stopped",
        description: "Time entry has been saved successfully.",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/time-entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Time entry deleted",
        description: "The time entry has been removed.",
      });
    },
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = now.getTime() - start.getTime();
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p: any) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Time Tracking</h2>
              <p className="text-sm text-slate-500">Track your work hours across projects</p>
            </div>
            <Button onClick={() => setShowNewTimerModal(true)}>
              <Play className="w-4 h-4 mr-2" />
              Start New Timer
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Active Timer */}
          {activeTimer && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3" />
                  Active Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {getProjectName(activeTimer.projectId)}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {activeTimer.description || "Time tracking session"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-slate-900">
                        {formatElapsedTime(activeTimer.startTime)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Started at {new Date(activeTimer.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stopTimerMutation.mutate(activeTimer.id)}
                      disabled={stopTimerMutation.isPending}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Time Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : timeEntries && timeEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="font-medium">
                              {getProjectName(entry.projectId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.description || "No description"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.isRunning ? (
                            <span className="text-red-600 animate-pulse">
                              Running...
                            </span>
                          ) : entry.duration ? (
                            formatDuration(entry.duration)
                          ) : (
                            "0:00"
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(entry.startTime).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={entry.isRunning ? "destructive" : "secondary"}
                          >
                            {entry.isRunning ? "Running" : "Completed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // TODO: Implement edit functionality
                                toast({
                                  title: "Edit Time Entry",
                                  description: "Edit functionality coming soon!",
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteEntryMutation.mutate(entry.id)}
                              disabled={deleteEntryMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No time entries found</p>
                  <p className="text-sm">Start tracking time to see entries here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <NewTimerModal 
        open={showNewTimerModal} 
        onOpenChange={setShowNewTimerModal}
      />
    </div>
  );
}
