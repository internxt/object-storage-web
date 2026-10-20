import { describe } from 'vitest';
import wholesalersAxios from './wholesalers-axios';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { describeScopedAxiosContract } from '../../testing/scoped-axios-contract';

describe('wholesalersAxios', () => {
  describeScopedAxiosContract(() => wholesalersAxios, wholesalersAuthService, '/wholesalers/login');
});
