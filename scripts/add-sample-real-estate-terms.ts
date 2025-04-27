import { db } from '../server/db';
import { realEstateTerms } from '../shared/schema';

const sampleTerms = [
  {
    term: 'Appraisal',
    definition: 'An estimate of the market value of a property, performed by a licensed or certified appraiser.',
    category: 'Valuation',
    contextualExplanation: 'Appraisals are typically required by lenders before issuing a mortgage loan to ensure the property value supports the loan amount.',
    examples: ['Mortgage appraisal', 'Tax assessment appraisal', 'Insurance appraisal'],
    relatedTerms: ['Market Value', 'Comparable Sales', 'Assessment'],
    isCommon: true,
    source: 'The Appraisal Institute'
  },
  {
    term: 'Market Value',
    definition: 'The most probable price a property would bring in an open and competitive market under fair sale conditions.',
    category: 'Valuation',
    contextualExplanation: 'Market value assumes both buyer and seller are acting knowledgeably and in their own best interest, with reasonable time for exposure on the open market.',
    examples: ['Fair market value', 'Current market value', 'Appraised market value'],
    relatedTerms: ['Appraisal', 'Comparable Sales', 'Fair Market Value'],
    isCommon: true,
    source: 'The Appraisal Institute'
  },
  {
    term: 'Millage Rate',
    definition: 'The tax rate applied to real estate or other property, expressed in mills per dollar of value. One mill equals one-tenth of one cent ($0.001).',
    category: 'Taxation',
    contextualExplanation: 'Millage rates are used by local governments to calculate property taxes. For example, a millage rate of 10 mills means a tax of $10 for every $1,000 of assessed property value.',
    examples: ['School district millage', 'County millage rate', 'Combined millage rate'],
    relatedTerms: ['Property Tax', 'Assessment', 'Tax Levy'],
    isCommon: false,
    source: 'International Association of Assessing Officers'
  },
  {
    term: 'Comparable Sales',
    definition: 'Properties similar to a subject property that have recently sold, used to estimate the value of the subject property.',
    category: 'Valuation',
    contextualExplanation: 'Appraisers typically use 3-6 comparable sales (comps) when determining a property\'s value, making adjustments for differences between the comps and the subject property.',
    examples: ['Recent neighborhood sales', 'Similar property sales', 'Adjusted comparable sales'],
    relatedTerms: ['Appraisal', 'Market Value', 'Adjustment'],
    isCommon: true,
    source: 'The Appraisal Institute'
  },
  {
    term: 'Assessment',
    definition: 'The official valuation of property for tax purposes, performed by a government assessor.',
    category: 'Taxation',
    contextualExplanation: 'Assessments are often performed on a mass scale for all properties in a jurisdiction, and may not reflect current market value depending on when the last assessment was conducted.',
    examples: ['County tax assessment', 'Municipal assessment', 'Assessment ratio'],
    relatedTerms: ['Property Tax', 'Assessed Value', 'Millage Rate'],
    isCommon: true,
    source: 'International Association of Assessing Officers'
  }
];

async function addSampleRealEstateTerms() {
  try {
    console.log('Adding sample real estate terms...');
    
    // Check each term and add it if it doesn't exist
    for (const term of sampleTerms) {
      // Check if the term already exists
      const existingTerm = await db.select()
        .from(realEstateTerms)
        .where(realEstateTerms.term.equals(term.term));
      
      if (existingTerm.length === 0) {
        // Term doesn't exist, add it
        await db.insert(realEstateTerms).values({
          term: term.term,
          definition: term.definition,
          category: term.category,
          contextualExplanation: term.contextualExplanation,
          examples: term.examples,
          relatedTerms: term.relatedTerms,
          isCommon: term.isCommon,
          source: term.source
        });
        console.log(`Added term: ${term.term}`);
      } else {
        console.log(`Term already exists: ${term.term}`);
      }
    }
    
    console.log('Sample terms process completed.');
  } catch (error) {
    console.error('Error adding sample terms:', error);
  } finally {
    process.exit(0);
  }
}

addSampleRealEstateTerms();