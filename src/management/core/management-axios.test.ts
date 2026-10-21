import { describe } from 'vitest';
import managementAxios from './management-axios';
import { managementAuthService } from '../services/management-auth.service';
import { describeScopedAxiosContract } from '../../testing/scoped-axios-contract';

describe('managementAxios', () => {
  describeScopedAxiosContract(() => managementAxios, managementAuthService, '/management/login');
});
