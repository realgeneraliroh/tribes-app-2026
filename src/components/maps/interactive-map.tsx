
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import Image from 'next/image';

interface InteractiveMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  locationName?: string;
  className?: string;
}

/**
 * InteractiveMap Component Placeholder
 * 
 * This component is a placeholder for integrating a real interactive map.
 * It currently shows a static placeholder image.
 */
export function InteractiveMap({
  latitude,
  longitude,
  zoom = 13,
  locationName,
  className,
}: InteractiveMapProps) {
  // In a real implementation, you'd use latitude, longitude, and zoom
  // to initialize and center the map from the chosen library.

  // Using a static placeholder image for now
  const placeholderMapImage = `https://placehold.co/600x300.png?text=${encodeURIComponent(locationName || 'Map Location')}`;


  return (
    <Card className={className}>
      <CardContent className="p-0 aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative overflow-hidden border">
        <Image 
            src={placeholderMapImage} 
            alt={`Map placeholder for ${locationName || 'event location'}`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="map location placeholder"
        />
        {/* Overlaying location name for context, can be removed if map image includes it well */}
        {!locationName && (
          <MapPin className="absolute h-12 w-12 text-white/70 opacity-50 mb-2 drop-shadow-lg" style={{top: 'calc(50% - 3rem)', left: 'calc(50% - 1.5rem)'}}/>
        )}
        <p className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          Interactive map preview coming soon
        </p>
      </CardContent>
    </Card>
  );
}

export default InteractiveMap;
