"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { ArrowRight, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Label } from "../components/ui/label";

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [icp, setIcp] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      // In real implementation, redirect to dashboard
      console.log("Analyzing:", { url, icp });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Blossomer</span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="text-gray-600">Playground</Button>
                <Button variant="ghost" className="text-gray-600">Templates</Button>
                <Button variant="ghost" className="text-gray-600">Docs</Button>
                <Button variant="ghost" className="text-gray-600">Pricing</Button>
                <Button variant="ghost" className="text-gray-600">Blog</Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600">Sign in</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Dashboard</Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Promotional Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Sparkles className="w-4 h-4" />
              <span>Get your first GTM analysis free - no credit card required</span>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI-powered GTM
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">for startups & founders</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your website URL into a complete Go-to-Market strategy. Get company insights, target customers, and campaign ideas powered by AI.
          </p>
          {/* Sandbox Form */}
          <Card className="max-w-2xl mx-auto p-8 shadow-lg border-0 bg-gray-50">
            <CardContent className="space-y-6 p-0">
              <div>
                <Label htmlFor="url" className="mb-2 text-left block">Website URL *</Label>
                <div className="relative">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://your-startup.com"
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                    className="pr-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div>
                <Label htmlFor="icp" className="mb-2 text-left block">Ideal Customer Profile (Optional)</Label>
                <Textarea
                  id="icp"
                  placeholder="e.g., B2B SaaS companies with 50-200 employees in the fintech space..."
                  value={icp}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIcp(e.target.value)}
                  className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
                className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing website...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Generate GTM Strategy</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">Company Analysis</CardTitle>
                <CardDescription className="text-gray-600">Deep insights into your business model, value proposition, and market positioning</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">Target Customers</CardTitle>
                <CardDescription className="text-gray-600">Identify ideal customer profiles, personas, and prospecting sources</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">Campaign Ideas</CardTitle>
                <CardDescription className="text-gray-600">AI-generated marketing campaigns and go-to-market strategies</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 