export function StatusBadge({ status }) {
  const statusStyles = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const priorityStyles = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[priority] || 'bg-gray-100 text-gray-800'}`}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

export function GenderBadge({ gender }) {
  const genderStyles = {
    male: 'bg-blue-100 text-blue-800',
    female: 'bg-pink-100 text-pink-800',
    unisex: 'bg-purple-100 text-purple-800',
  };

  const genderIcons = {
    male: '♂',
    female: '♀',
    unisex: '⚥',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${genderStyles[gender] || 'bg-gray-100 text-gray-800'}`}>
      <span>{genderIcons[gender]}</span>
      {gender?.charAt(0).toUpperCase() + gender?.slice(1)}
    </span>
  );
}

export default StatusBadge;
