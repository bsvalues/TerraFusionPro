import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="p-6 border rounded-md shadow-sm flex flex-col items-center justify-center space-y-4">
      <LoadingSpinner />
      <p className="text-muted-foreground">Loading data...</p>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
}