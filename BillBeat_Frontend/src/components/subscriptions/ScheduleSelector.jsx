const days = [['monday', 'Mon'], ['tuesday', 'Tue'], ['wednesday', 'Wed'], ['thursday', 'Thu'], ['friday', 'Fri'], ['saturday', 'Sat'], ['sunday', 'Sun']];

export default function ScheduleSelector({ register, values }) {
  return <div><p className="mb-3 text-sm font-semibold text-[#383331]">Delivery days</p><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{days.map(([name, label]) => <label key={name} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition ${values[name] ? 'border-[#f0b1ab] bg-[#fff0ee] text-[#b42318]' : 'border-[#e6e1dd] bg-white text-[#706a65]'}`}><input className="sr-only" type="checkbox" {...register(`deliverySchedule.${name}`)} />{label}</label>)}</div></div>;
}