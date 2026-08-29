import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { LocationPickerMap } from "./LocationPickerMap";
import * as geocode from "../lib/geocode";

// Mock react-leaflet
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
    useMapEvents: (handlers: any) => {
      // Expose map click simulation for testing
      (window as any).simulateMapClick = (lat: number, lng: number) => {
        handlers.click({ latlng: { lat, lng } });
      };
      return null;
    }
  };
});

describe("LocationPickerMap", () => {
  it("shows an alert and passes data without pincode when geocoding fails to find pincode", async () => {
    // Mock the geocode function to return no pincode
    vi.spyOn(geocode, "reverseGeocode").mockResolvedValueOnce({
      address: "Some Generic Address",
      lat: 28,
      lng: 77,
      pincode: undefined
    });

    const onSelectMock = vi.fn();
    render(<LocationPickerMap label="Pick Location" onSelect={onSelectMock} />);

    // Simulate clicking on the map
    (window as any).simulateMapClick(28, 77);

    // Wait for the 800ms debounce and state updates
    await waitFor(() => {
      expect(screen.getByText(/Pin dropped successfully, but please manually confirm your Pincode/i)).not.toBeNull();
    }, { timeout: 1500 });

    expect(onSelectMock).toHaveBeenCalledWith({
      address: "Some Generic Address",
      lat: 28,
      lng: 77,
      pincode: undefined
    });
  });
});
