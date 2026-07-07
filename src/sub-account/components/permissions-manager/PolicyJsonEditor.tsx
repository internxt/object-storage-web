import { form } from '../../tokens';

interface PolicyJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: boolean;
}

export const PolicyJsonEditor = ({ value, onChange, error }: PolicyJsonEditorProps) => (
  <div className='flex flex-col gap-1 min-h-0'>
    <label className='shrink-0' style={form.label}>Policy JSON</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder='{ "Version": "2012-10-17", "Statement": [] }'
      className='min-h-0 resize-none'
      style={{ ...form.textarea, fontFamily: 'monospace', fontSize: 12, height: 260 }}
    />
    <p className='shrink-0' style={form.hint}>
      {error
        ? 'Invalid JSON — must be an object with a "Statement" array.'
        : 'Edit the raw IAM policy. The backend validates the actions on save.'}
    </p>
  </div>
);
