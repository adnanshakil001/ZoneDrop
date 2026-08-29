export interface GeocodeResult {
  address: string;
  pincode: string | null;
  lat: number;
  lng: number;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9", // Ask for English results
    },
  });

  if (!response.ok) {
    throw new Error("Geocoding failed");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const addressObj = data.address || {};
  
  // Extract pincode (postcode in Nominatim)
  const pincode = addressObj.postcode || null;

  // Build a reasonably clean address string
  const addressParts = [];
  if (addressObj.road) addressParts.push(addressObj.road);
  if (addressObj.suburb) addressParts.push(addressObj.suburb);
  if (addressObj.city || addressObj.town || addressObj.village) {
    addressParts.push(addressObj.city || addressObj.town || addressObj.village);
  }
  if (addressObj.state) addressParts.push(addressObj.state);

  const address = addressParts.length > 0 ? addressParts.join(", ") : data.display_name;

  return {
    address,
    pincode,
    lat,
    lng,
  };
}
