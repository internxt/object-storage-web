import { SubAccountDetailPage } from '../../management/views/SubAccountDetailPage';
import { partnersService } from '../services/partners.service';

export const PartnersSubAccountDetailPage = () => (
  <SubAccountDetailPage backPath='/partners/sub-accounts' service={partnersService} />
);
