import { SubAccountDetailPage } from '../../components/SubAccountDetailPage';
import { partnersService } from '../services/partners.service';

export const PartnersSubAccountDetailPage = () => (
  <SubAccountDetailPage backPath='/partners/sub-accounts' service={partnersService} />
);
