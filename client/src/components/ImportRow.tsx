import { validateComp, ValidationIssue, TerraFusionComp } from '../../../server/services/schema-validator';

interface ImportRowProps {
  comp: TerraFusionComp;
}

export default function ImportRow({ comp }: ImportRowProps) {
  const issues = validateComp(comp);
  const hasIssues = issues.length > 0;
  const hasHighSeverity = issues.some(issue => issue.severity === 'high');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const pricePerSqft = comp.sale_price_usd && comp.gla_sqft ? 
    (comp.sale_price_usd / comp.gla_sqft).toFixed(0) : 'N/A';

  return (
    <div className={`border-b p-3 grid grid-cols-6 gap-3 text-sm font-mono hover:bg-gray-50 ${
      hasHighSeverity ? 'bg-red-50 border-red-200' : 
      hasIssues ? 'bg-yellow-50 border-yellow-200' : 
      'bg-white'
    }`}>
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{comp.address}</span>
        <span className="text-xs text-gray-500">{comp.source_table}</span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="font-semibold text-green-700">
          ${comp.sale_price_usd?.toLocaleString() || 'N/A'}
        </span>
        <span className="text-xs text-gray-500">
          ${pricePerSqft}/sqft
        </span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-gray-900">{comp.gla_sqft?.toLocaleString() || 'N/A'} sqft</span>
        {comp.bedrooms !== undefined && comp.bathrooms !== undefined && (
          <span className="text-xs text-gray-500">
            {comp.bedrooms}br / {comp.bathrooms}ba
          </span>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-gray-900">{comp.sale_date || 'N/A'}</span>
        {comp.year_built && (
          <span className="text-xs text-gray-500">Built {comp.year_built}</span>
        )}
      </div>
      
      <div className="flex flex-col">
        {hasIssues ? (
          <div className="space-y-1">
            {issues.slice(0, 2).map((issue, index) => (
              <div key={index} className={`text-xs ${getSeverityColor(issue.severity)}`}>
                {issue.message}
              </div>
            ))}
            {issues.length > 2 && (
              <span className="text-xs text-gray-400">
                +{issues.length - 2} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-green-600">✓ Valid</span>
        )}
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        {hasHighSeverity && (
          <div className="w-2 h-2 bg-red-500 rounded-full" title="High severity issues"></div>
        )}
        {hasIssues && !hasHighSeverity && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Medium severity issues"></div>
        )}
        {!hasIssues && (
          <div className="w-2 h-2 bg-green-500 rounded-full" title="No issues"></div>
        )}
      </div>
    </div>
  );
}