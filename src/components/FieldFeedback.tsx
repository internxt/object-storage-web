import { AlertCircle } from 'lucide-react';
import { T } from '../sub-account/tokens';

export const PasswordRequirements = ({
  errors,
  variant = 'box',
}: {
  errors: string[];
  variant?: 'box' | 'list';
}) =>
  variant === 'list' ? (
    <ul
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {errors.map((error) => (
        <li key={error} style={{ fontSize: 12, color: T.red }}>
          · {error}
        </li>
      ))}
    </ul>
  ) : (
    <div className='p-2 bg-red/10 border border-red rounded-md mt-2'>
      <div className='flex items-start gap-2'>
        <AlertCircle className='w-4 h-4 text-red flex-shrink-0 mt-0.5' />
        <div className='text-xs text-red-dark'>
          <p className='font-medium mb-1'>Password must contain:</p>
          <ul className='space-y-1'>
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

export const FieldErrorMessage = ({ message }: { message: string }) => (
  <p style={{ fontSize: 12, color: T.red, margin: '6px 0 0' }}>{message}</p>
);
