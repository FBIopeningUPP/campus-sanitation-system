import { 
  Droplets, 
  AlertTriangle, 
  Wrench, 
  Wind, 
  Zap, 
  HelpCircle,
  SprayCan,
  CircleOff
} from 'lucide-react';

const issueTypes = {
  dirty_toilet: { label: 'Dirty Toilet', icon: CircleOff, color: 'text-amber-600' },
  missing_soap: { label: 'Missing Soap', icon: SprayCan, color: 'text-blue-600' },
  water_shortage: { label: 'Water Shortage', icon: Droplets, color: 'text-cyan-600' },
  broken_fixture: { label: 'Broken Fixture', icon: Wrench, color: 'text-gray-600' },
  bad_odor: { label: 'Bad Odor', icon: Wind, color: 'text-green-600' },
  no_water: { label: 'No Water', icon: Droplets, color: 'text-red-600' },
  electrical: { label: 'Electrical Issue', icon: Zap, color: 'text-yellow-600' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-purple-600' },
};

export default function IssueTypeLabel({ type, showIcon = true }) {
  const issueType = issueTypes[type] || issueTypes.other;
  const Icon = issueType.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 ${issueType.color}`}>
      {showIcon && <Icon className="w-4 h-4" />}
      <span>{issueType.label}</span>
    </span>
  );
}

export function getIssueTypeOptions() {
  return Object.entries(issueTypes).map(([value, { label }]) => ({
    value,
    label,
  }));
}
