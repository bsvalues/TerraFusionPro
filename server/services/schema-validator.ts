export interface ValidationIssue {
  field: string;
  type: 'missing' | 'suspicious' | 'anomaly' | 'format';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TerraFusionComp {
  address: string;
  sale_price_usd: number;
  gla_sqft: number;
  sale_date: string;
  source_table: string;
  bedrooms?: number;
  bathrooms?: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type?: string;
}

export function validateComp(comp: TerraFusionComp): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Required field validation
  if (!comp.address || comp.address.trim() === '') {
    issues.push({
      field: 'address',
      type: 'missing',
      message: 'Address is required',
      severity: 'high'
    });
  }

  if (!comp.sale_date) {
    issues.push({
      field: 'sale_date',
      type: 'missing',
      message: 'Sale date is required',
      severity: 'high'
    });
  }

  // Sale price validation
  if (comp.sale_price_usd === undefined || comp.sale_price_usd === null) {
    issues.push({
      field: 'sale_price_usd',
      type: 'missing',
      message: 'Sale price is required',
      severity: 'high'
    });
  } else if (comp.sale_price_usd < 1000) {
    issues.push({
      field: 'sale_price_usd',
      type: 'suspicious',
      message: 'Sale price unusually low (< $1,000)',
      severity: 'medium'
    });
  } else if (comp.sale_price_usd > 50000000) {
    issues.push({
      field: 'sale_price_usd',
      type: 'suspicious',
      message: 'Sale price unusually high (> $50M)',
      severity: 'medium'
    });
  }

  // GLA validation
  if (comp.gla_sqft === undefined || comp.gla_sqft === null) {
    issues.push({
      field: 'gla_sqft',
      type: 'missing',
      message: 'Gross living area is required',
      severity: 'high'
    });
  } else if (comp.gla_sqft < 200) {
    issues.push({
      field: 'gla_sqft',
      type: 'suspicious',
      message: 'GLA unusually small (< 200 sqft)',
      severity: 'medium'
    });
  } else if (comp.gla_sqft > 20000) {
    issues.push({
      field: 'gla_sqft',
      type: 'suspicious',
      message: 'GLA unusually large (> 20,000 sqft)',
      severity: 'medium'
    });
  }

  // Date format validation
  if (comp.sale_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(comp.sale_date)) {
      issues.push({
        field: 'sale_date',
        type: 'format',
        message: 'Sale date should be in YYYY-MM-DD format',
        severity: 'medium'
      });
    } else {
      const saleDate = new Date(comp.sale_date);
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      
      if (saleDate > now) {
        issues.push({
          field: 'sale_date',
          type: 'anomaly',
          message: 'Sale date is in the future',
          severity: 'high'
        });
      } else if (saleDate < new Date('1900-01-01')) {
        issues.push({
          field: 'sale_date',
          type: 'anomaly',
          message: 'Sale date is too old (before 1900)',
          severity: 'medium'
        });
      }
    }
  }

  // Price per square foot validation
  if (comp.sale_price_usd && comp.gla_sqft && comp.gla_sqft > 0) {
    const pricePerSqft = comp.sale_price_usd / comp.gla_sqft;
    if (pricePerSqft < 10) {
      issues.push({
        field: 'price_per_sqft',
        type: 'suspicious',
        message: `Price per sqft unusually low ($${pricePerSqft.toFixed(2)})`,
        severity: 'medium'
      });
    } else if (pricePerSqft > 2000) {
      issues.push({
        field: 'price_per_sqft',
        type: 'suspicious',
        message: `Price per sqft unusually high ($${pricePerSqft.toFixed(2)})`,
        severity: 'medium'
      });
    }
  }

  // Bedroom/bathroom validation
  if (comp.bedrooms !== undefined && comp.bedrooms < 0) {
    issues.push({
      field: 'bedrooms',
      type: 'anomaly',
      message: 'Negative bedroom count',
      severity: 'high'
    });
  }

  if (comp.bathrooms !== undefined && comp.bathrooms < 0) {
    issues.push({
      field: 'bathrooms',
      type: 'anomaly',
      message: 'Negative bathroom count',
      severity: 'high'
    });
  }

  // Year built validation
  if (comp.year_built !== undefined) {
    const currentYear = new Date().getFullYear();
    if (comp.year_built < 1800 || comp.year_built > currentYear + 5) {
      issues.push({
        field: 'year_built',
        type: 'anomaly',
        message: `Year built out of reasonable range (${comp.year_built})`,
        severity: 'medium'
      });
    }
  }

  // Lot size validation
  if (comp.lot_size_sqft !== undefined && comp.lot_size_sqft < 0) {
    issues.push({
      field: 'lot_size_sqft',
      type: 'anomaly',
      message: 'Negative lot size',
      severity: 'high'
    });
  }

  return issues;
}

export function getValidationSummary(issues: ValidationIssue[]): {
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;
  highSeverityCount: number;
} {
  const highSeverityCount = issues.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;
  
  return {
    hasErrors: issues.length > 0,
    errorCount: issues.length,
    warningCount: mediumSeverityCount,
    highSeverityCount
  };
}