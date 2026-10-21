import { describe } from 'vitest';
import subAccountAxios from './sub-account-axios';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { describeScopedAxiosContract } from '../../testing/scoped-axios-contract';

describe('subAccountAxios', () => {
  describeScopedAxiosContract(() => subAccountAxios, subAccountAuthService, '/subaccount/login');
});
