import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Home, School, DollarSign, Calendar } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const API_URL = import.meta.env.VITE_API_URL;

const PropertyView = () => {
  const [address, setAddress] = useState('1600 Amphitheatre Parkway, Mountain View, CA 94043');
  const [propertyData, setPropertyData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getLoadingMessage = (progress) => {
    if (progress < 20) return "Scanning the neighborhood... 🏘️";
    if (progress < 40) return "Peeking through windows... 👀";
    if (progress < 60) return "Hopping fences to find schools... 🏃‍♂️";
    if (progress < 80) return "Counting trees and parks... 🌳";
    if (progress < 100) return "Interviewing local squirrels... 🐿️";
    return "Almost there! Just measuring the sidewalks... 📏";
  };

  const handleSearch = async () => {
    if (!address.trim()) {
      setError('Please enter a valid address');
      return;
    }

    setLoading(true);
    setError('');
    
    let progressValue = 0;
    const toastId = toast.loading(
      <div className="w-full space-y-3 min-w-[300px]">
        <p className="text-base font-medium">{getLoadingMessage(progressValue)}</p>
        <Progress value={progressValue} className="w-full h-2" />
      </div>,
      {
        className: "bg-white dark:bg-gray-800 shadow-lg",
      }
    );

    // Simulate progress updates with slower intervals
    const progressInterval = setInterval(() => {
      progressValue += 20; // Bigger jumps for fewer updates
      if (progressValue <= 90) {
        toast.loading(
          <div className="w-full space-y-3 min-w-[300px]">
            <p className="text-base font-medium">{getLoadingMessage(progressValue)}</p>
            <Progress value={progressValue} className="w-full h-2" />
          </div>,
          { 
            id: toastId,
            className: "bg-white dark:bg-gray-800 shadow-lg",
          }
        );
      }
    }, 2000); // Increased to 2 seconds between updates

    try {
      const response = await fetch(`${API_URL}/property?address=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error('Failed to fetch property data');
      const data = await response.json();
      setPropertyData(data);
      
      // Update to 100% progress
      toast.loading(
        <div className="w-full space-y-3 min-w-[300px]">
          <p className="text-base font-medium">{getLoadingMessage(100)}</p>
          <Progress value={100} className="w-full h-2" />
        </div>,
        { 
          id: toastId,
          className: "bg-white dark:bg-gray-800 shadow-lg",
        }
      );

      // Dismiss after a longer delay with success message
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.success('Found the perfect spot! 🏠', {
          duration: 3000,
          className: "bg-white dark:bg-gray-800 shadow-lg text-base font-medium",
        });
      }, 2000); // Increased to 2 seconds

    } catch (err) {
      console.error('Error details:', err);
      setError('Error fetching property data. Please try again.');
      toast.dismiss(toastId);
      toast.error('Oops! Got chased by a neighborhood dog 🐕', {
        duration: 3000,
        className: "bg-white dark:bg-gray-800 shadow-lg text-base font-medium",
      });
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Toaster 
        position="bottom-right" 
        expand={true} 
        richColors 
        closeButton
        theme="light"
        toastOptions={{
          style: {
            minWidth: '300px',
          },
        }}
      />
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">Property Search</h1>
          <p className="text-2xl text-gray-600 mb-8">Make property decisions with confidence</p>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Our platform combines property data, school information, and location intelligence to help you
            find the perfect home for your family's needs.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 shadow-lg rounded-lg bg-white p-2">
            <Input 
              placeholder="Enter property address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 text-lg h-14"
            />
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="px-8 h-14 text-lg bg-black hover:bg-gray-800"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {propertyData && (
        <div className="container mx-auto px-4 pb-16 max-w-6xl space-y-8">
          {/* Property Overview */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <MapPin className="h-6 w-6" />
                {propertyData.address}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Home className="h-6 w-6 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-500">Size</div>
                    <div className="font-semibold">{propertyData.details.size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-500">Value</div>
                    <div className="font-semibold">${propertyData.details.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="font-semibold">{new Date(propertyData.details.last_updated).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schools Section */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <School className="h-6 w-6" />
                Nearby Schools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertyData.schools
                  .sort((a, b) => b.rating - a.rating)
                  .map((school, index) => (
                    <Card key={index} className="border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-3">{school.name}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Rating</span>
                            <span className="font-medium bg-gray-100 px-2 py-1 rounded">{school.rating}/5</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Distance</span>
                            <span className="font-medium">{school.distance_km.toFixed(1)} km</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Type</span>
                            <span className="font-medium capitalize">{school.type}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PropertyView;
