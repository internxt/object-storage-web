import axiosInstance from '../core/config/axios';
import { PaginatedResponse } from '../types/paginatedResponse';

export interface User {
  email: string;
  id: string;
  usage: number;
}

export interface Member {
  id: string;
  email: string;
  subAccountId: number;
  firstName: string;
  lastName: string;
  username: string;
  memberRole: string;
  status: string;
  mfa: boolean;
  imageUrl: string | null;
  creationDate: string;
  address1: string | null;
  address2: string | null;
  country: string | null;
  city: string | null;
  stateName: string | null;
  zip: string | null;
  phone: string | null;
  isSsoUser: boolean;
}

const getUserData = async (): Promise<User> => {
  const userDataResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/account`
  );

  return userDataResponse.data;
};

const getMembers = async (): Promise<Member[]> => {
  const membersResponse = await axiosInstance.get<PaginatedResponse<Member>>(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/members`
  );

  return membersResponse.data.items;
};

export const userService = {
  getUserData,
  getMembers,
};
