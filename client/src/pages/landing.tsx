import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText, BarChart3, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">FreelanceTracker Pro</h1>
          </div>
          <Button onClick={handleLogin} size="lg">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Automate Your Freelance
            <span className="text-primary"> Business</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Track time, generate invoices, manage clients, and optimize your workflow with A/B testing. 
            The complete automation platform for professional freelancers.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-6">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600">Powerful features designed for modern freelancers</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Smart Time Tracking</CardTitle>
                <CardDescription>
                  Track time with one click. Automatic invoice generation based on logged hours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Automated Invoicing</CardTitle>
                <CardDescription>
                  Generate professional invoices automatically from tracked time. Multiple templates included.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                  Organize clients, track project progress, and maintain professional relationships.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle>A/B Testing</CardTitle>
                <CardDescription>
                  Test different invoice and quote templates to maximize your payment rates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Bank-level encryption for payment data. Role-based access control and activity logging.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Cloud Storage</CardTitle>
                <CardDescription>
                  All documents stored securely in the cloud. Access from anywhere, anytime.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Automate Your Business?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of freelancers who trust FreelanceTracker Pro
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2024 FreelanceTracker Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
