import axios from 'axios';
import { managementAuthService } from './management-auth.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/management`;
const headers = () => managementAuthService.getAuthHeaders();

export interface Wholesaler {
  id: string;
  name: string;
  email: string;
  customerId: string | null;
  partnersCount: number;
  createdAt: string;
}

export interface WholesalersResponse {
  wholesalers: Wholesaler[];
  total: number;
}

async function createWholesaler(dto: {
  name: string;
  email: string;
  password: string;
  country: string;
  postalCode: string;
}): Promise<void> {
  await axios.post(`${API()}/wholesalers`, dto, { headers: headers() });
}

interface RawWholesaler {
  id: string;
  name: string;
  email: string;
  customerId?: string | null;
  partnersCount?: number;
  createdAt?: string;
}

async function getWholesalers(params: {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<WholesalersResponse> {
  const response = await axios.get(`${API()}/wholesalers`, { headers: headers(), params });
  const data = response.data;
  const rawItems: RawWholesaler[] = data.items ?? [];
  return { wholesalers: rawItems.map(mapWholesaler), total: data.total ?? rawItems.length };
}

function mapWholesaler(raw: RawWholesaler): Wholesaler {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    customerId: raw.customerId ?? null,
    partnersCount: raw.partnersCount ?? 0,
    createdAt: raw.createdAt ?? '',
  };
}

export const wholesalersService = {
  createWholesaler,
  getWholesalers,
};
