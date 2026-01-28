import { format } from 'date-fns';

interface DateRangePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
}

export function DateRangePicker({
  label,
  value,
  onChange,
  min,
  max,
}: DateRangePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    onChange(date);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="date"
        value={format(value, 'yyyy-MM-dd')}
        onChange={handleChange}
        min={min ? format(min, 'yyyy-MM-dd') : undefined}
        max={max ? format(max, 'yyyy-MM-dd') : undefined}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  );
}
