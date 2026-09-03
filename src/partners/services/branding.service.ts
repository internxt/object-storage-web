import axios from 'axios';
import { partnersAuthService } from './partners-auth.service';

const BRANDING_API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/branding`;
const headers = () => partnersAuthService.getAuthHeaders();

export type Branding = {
  logoUrl: string | null;
  primaryColor: string | null;
}
async function getBranding(): Promise<Branding> {
  const response = await axios.get<Branding>(BRANDING_API(), { headers: headers() });
  return response.data;
}

async function updateBranding(branding: Branding): Promise<Branding> {
  const response = await axios.patch<Branding>(BRANDING_API(), branding, { headers: headers() });
  return response.data;
}

export const brandingService = {
  getBranding,
  updateBranding,
};
