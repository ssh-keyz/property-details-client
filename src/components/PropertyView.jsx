import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Home, School, DollarSign, Calendar } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Access environment variables from Next.js config
const API_URL = typeof window !== 'undefined' ? window.ENV?.NEXT_PUBLIC_API_URL || 'http://localhost:8080' : 'http://localhost:8080';
// Safely access Google Maps API key from window.ENV
const GOOGLE_MAPS_API_KEY = typeof window !== 'undefined' ? window.ENV?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined;

const PropertyView = () => {
  const [address, setAddress] = useState('1600 Amphitheatre Parkway, Mountain View, CA 94043');
  const [suggestions, setSuggestions] = useState([]);
  const [propertyData, setPropertyData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const exampleAddresses = [
    "2510 Bancroft Way, Berkeley, CA 94704",
    "123 Main Street, Los Angeles, CA 90012",
    "555 Market Street, San Francisco, CA 94105"
  ];

  useEffect(() => {
    // Only load Google Maps if API key is available
    if (GOOGLE_MAPS_API_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);

      return () => {
        // Cleanup script on component unmount
        document.head.removeChild(script);
      };
    }
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'name'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          setAddress(place.formatted_address);
          setSuggestions([]);
          handleSearch(place.formatted_address);
        }
      });
    } catch (error) {
      console.warn('Google Places Autocomplete initialization failed:', error);
    }
  };

  const getLoadingMessage = (progress) => {
    if (progress < 20) return "Scanning the neighborhood... 🏘️";
    if (progress < 40) return "Peeking through windows... 👀";
    if (progress < 60) return "Hopping fences... 🏃‍♂️";
    if (progress < 80) return "Counting trees and parks... 🌳";
    if (progress < 100) return "Interviewing local squirrels... 🐿️";
    return "Almost there! Just measuring the sidewalks... 📏";
  };

  const validateAddress = (address) => {
    // Basic address validation
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      return {
        isValid: false,
        error: 'Please enter a complete address (e.g., "1234 Main St, City, State")'
      };
    }

    // Less strict validation - just ensure we have some numbers and text
    if (!parts[0].match(/\d+/) || !parts[0].match(/[a-zA-Z]/)) {
      return {
        isValid: false,
        error: 'Please include both a street number and street name'
      };
    }

    return { isValid: true };
  };

  const handleSearch = async (selectedAddress = address) => {
    console.log('handleSearch called with address:', selectedAddress);
    
    if (!selectedAddress.trim()) {
      setError('Please enter a valid address');
      return;
    }

    // Validate address format
    const validation = validateAddress(selectedAddress);
    if (!validation.isValid) {
      setError(validation.error);
      toast.error('Address format needs attention 🏠', {
        description: validation.error,
        duration: 4000,
        className: "bg-white dark:bg-gray-800 shadow-lg text-base font-medium",
      });
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
      const endpoint = `${API_URL}/property?address=${encodeURIComponent(selectedAddress)}`;
      console.log('Fetching from:', endpoint);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to fetch property data');
      }
      
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
      let errorMessage = 'Unable to find property information. ';
      
      // More user-friendly error messages
      if (err.message.includes('Failed to fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (err.message.includes('404')) {
        errorMessage += 'We couldn\'t find this address in our database.';
      } else if (err.message.includes('500')) {
        errorMessage += 'Our property lookup service is having issues. Please try again in a few minutes.';
      } else if (err.message.includes('invalid address format')) {
        errorMessage = 'The address format wasn\'t recognized. Please try reformatting it (e.g., "Street Number Street Name, City, State ZIP")';
      } else if (err.message.includes('address validation failed')) {
        errorMessage = 'We couldn\'t validate this address. Please check for typos and try again.';
      } else {
        errorMessage += 'Please verify the address and try again.';
      }
      
      setError(errorMessage);
      toast.dismiss(toastId);
      toast.error('Oops! Something went wrong 🏠', {
        description: errorMessage,
        duration: 5000,
        className: "bg-white dark:bg-gray-800 shadow-lg text-base font-medium",
      });
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const onSearchClick = () => {
    console.log('Search clicked, address:', address);
    handleSearch(address);
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
          <div className="relative">
            <div className="flex gap-3 shadow-lg rounded-lg bg-white p-2">
              <Input 
                ref={inputRef}
                type="text"
                name="address"
                placeholder="Enter property address..."
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                }}
                onFocus={() => setShowExamples(true)}
                onBlur={() => {
                  // Small delay to keep examples visible if there's an error
                  setTimeout(() => {
                    if (!error) {
                      setShowExamples(false);
                    }
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSearchClick();
                  }
                }}
                className="flex-1 text-lg h-14"
              />
              <button 
                type="button"
                onClick={onSearchClick}
                disabled={loading}
                className="px-8 h-14 text-lg bg-black hover:bg-gray-800 text-white rounded-md"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Example Addresses */}
            {(showExamples || error) && (
              <div className="absolute w-full mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 space-y-2 z-10">
                <p className="text-sm font-medium text-gray-600">Example formats:</p>
                <div className="space-y-1.5">
                  {exampleAddresses.map((example, index) => (
                    <div 
                      key={index}
                      className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => {
                        setAddress(example);
                        setShowExamples(false);
                        setError('');
                      }}
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
