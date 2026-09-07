import { CSSProperties } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import { T } from '../../sub-account/tokens';

export const ROOT_SEGMENT_INDEX = -1;

const crumbStyle = (isCurrent: boolean): CSSProperties => ({
  border: 'none', background: 'none', padding: 0,
  cursor: isCurrent ? 'default' : 'pointer',
  fontSize: 13, fontWeight: isCurrent ? 600 : 400,
  color: isCurrent ? T.gray100 : T.primary,
});

interface BreadcrumbProps {
  rootName: string;
  segments: string[];
  onNavigate: (index: number) => void;
}

export const Breadcrumb = ({ rootName, segments, onNavigate }: BreadcrumbProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 24px', borderBottom: `1px solid ${T.gray15}`, flexWrap: 'wrap' }}>
    <button type="button" onClick={() => onNavigate(ROOT_SEGMENT_INDEX)} style={crumbStyle(false)}>
      {rootName}
    </button>
    {segments.map((segment, i) => {
      const isLast = i === segments.length - 1;
      const path = segments.slice(0, i + 1).join('/');
      return (
        <span key={path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CaretRightIcon size={12} color={T.gray50} />
          <button type="button" onClick={() => onNavigate(i)} style={crumbStyle(isLast)}>
            {segment}
          </button>
        </span>
      );
    })}
  </div>
);
