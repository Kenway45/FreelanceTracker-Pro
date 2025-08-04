import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Play, Pause, BarChart3, TrendingUp, FlaskConical, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function AbTesting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ["/api/ab-tests"],
    retry: false,
  });

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ab-tests", {
        name: "New A/B Test",
        description: "Test different template variants",
        type: "invoice_template",
        variantA: { template: "standard", color: "blue" },
        variantB: { template: "modern", color: "green" },
        successMetric: "payment_rate",
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      toast({
        title: "A/B Test created",
        description: "A new test has been created and is ready to configure.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create A/B test.",
        variant: "destructive",
      });
    },
  });

  const updateTestStatusMutation = useMutation({
    mutationFn: async ({ testId, status }: { testId: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'running') {
        updateData.startDate = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.endDate = new Date().toISOString();
      }
      await apiRequest("PUT", `/api/ab-tests/${testId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      toast({
        title: "Test updated",
        description: "A/B test status has been updated.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update test.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'running':
        return 'default';
      case 'paused':
        return 'outline';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'invoice_template':
        return 'Invoice Template';
      case 'quote_template':
        return 'Quote Template';
      case 'email_template':
        return 'Email Template';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getMetricDisplay = (metric: string) => {
    switch (metric) {
      case 'payment_rate':
        return 'Payment Rate';
      case 'response_rate':
        return 'Response Rate';
      case 'open_rate':
        return 'Open Rate';
      default:
        return metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const filteredTests = tests?.filter((test: any) => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">A/B Testing</h2>
              <p className="text-sm text-slate-500">Optimize your templates with data-driven testing</p>
            </div>
            <Button onClick={() => createTestMutation.mutate()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Running Tests Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {filteredTests.filter((test: any) => test.status === 'running').map((test: any) => (
              <Card key={test.id} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <p className="text-sm text-slate-500">{test.description}</p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    Running
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Variant A</span>
                        <span className="text-sm text-slate-600">52% conversion</span>
                      </div>
                      <Progress value={52} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Variant B</span>
                        <span className="text-sm text-slate-600">48% conversion</span>
                      </div>
                      <Progress value={48} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Success Metric: {getMetricDisplay(test.successMetric)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTestStatusMutation.mutate({
                          testId: test.id,
                          status: 'paused'
                        })}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All Tests Table */}
          <Card>
            <CardHeader>
              <CardTitle>All A/B Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {testsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredTests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Success Metric</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test: any) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{test.name}</div>
                            {test.description && (
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {test.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeDisplay(test.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(test.status)} className="capitalize">
                            {test.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getMetricDisplay(test.successMetric)}
                        </TableCell>
                        <TableCell>
                          {test.startDate ? 
                            new Date(test.startDate).toLocaleDateString() : 
                            "Not started"
                          }
                        </TableCell>
                        <TableCell>
                          {test.startDate && test.endDate ? 
                            `${Math.ceil((new Date(test.endDate).getTime() - new Date(test.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` :
                            test.startDate ? 
                              `${Math.ceil((Date.now() - new Date(test.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` :
                              "0 days"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {test.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTestStatusMutation.mutate({
                                  testId: test.id,
                                  status: 'running'
                                })}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {test.status === 'running' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateTestStatusMutation.mutate({
                                    testId: test.id,
                                    status: 'paused'
                                  })}
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateTestStatusMutation.mutate({
                                    testId: test.id,
                                    status: 'completed'
                                  })}
                                >
                                  Complete
                                </Button>
                              </>
                            )}
                            {test.status === 'paused' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTestStatusMutation.mutate({
                                  testId: test.id,
                                  status: 'running'
                                })}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "View Results",
                                  description: "Detailed analytics coming soon!",
                                });
                              }}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No A/B tests found</p>
                  <p className="text-sm">Create your first test to optimize your templates</p>
                  <Button className="mt-4" onClick={() => createTestMutation.mutate()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
