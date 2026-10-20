import managementAxios from '../core/management-axios';

const API = '/management';

export interface Wholesaler {
  id: string;
  name: string;
  email: string;
  customerId: string | null;
  partnersCount: number;
  activeStorageTb: number;
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
  await managementAxios.post(`${API}/wholesalers`, dto);
}

interface RawWholesaler {
  id: string;
  name: string;
  email: string;
  customerId?: string | null;
  partnersCount?: number;
  activeStorageTb?: number;
  createdAt?: string;
}

async function getWholesalers(params: {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<WholesalersResponse> {
  const response = await managementAxios.get(`${API}/wholesalers`, { params });
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
    // Already in TB from the backend — do not divide/multiply again here.
    activeStorageTb: raw.activeStorageTb ?? 0,
    createdAt: raw.createdAt ?? '',
  };
}

export const wholesalersService = {
  createWholesaler,
  getWholesalers,
};
