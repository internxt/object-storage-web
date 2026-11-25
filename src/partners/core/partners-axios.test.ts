import { describe } from 'vitest';
import partnersAxios from './partners-axios';
import { partnersAuthService } from '../services/partners-auth.service';
import { describeRecoveryPagesContract, describeScopedAxiosContract } from '../../testing/scoped-axios-contract';

describe('partnersAxios', () => {
  describeScopedAxiosContract(() => partnersAxios, partnersAuthService, '/partners/login');
  describeRecoveryPagesContract(() => partnersAxios, partnersAuthService, '/partners');
});
