/**
 * TerraFusion Universal Conversion Agent Test
 * Demonstrates the integrated Rust conversion functionality
 */

import fetch from 'node-fetch';

async function testUniversalConversionAgent() {
    console.log('=== TerraFusion Universal Conversion Agent Test ===\n');

    const baseUrl = 'http://localhost:5000';

    try {
        // 1. Test health check
        console.log('1. Testing Conversion Agent Health...');
        const healthResponse = await fetch(`${baseUrl}/api/conversion/health`);
        const healthData = await healthResponse.json();
        console.log('Health Status:', healthData);
        console.log('Rust Agent Ready:', healthData.rustAgentReady);

        // 2. Test property data conversion
        console.log('\n2. Testing Property Data Conversion...');
        const sampleProperties = [
            {
                address: "123 Main St, Austin TX",
                price: 450000,
                sqft: 2200,
                bedrooms: 4
            },
            {
                address: "456 Oak Ave, Dallas TX", 
                price: 350000,
                sqft: 1800,
                bedrooms: 3
            },
            {
                address: "789 Pine Dr, Houston TX",
                price: 525000,
                sqft: 2500,
                bedrooms: 5
            }
        ];

        const conversionResponse = await fetch(`${baseUrl}/api/conversion/property`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: sampleProperties,
                templateName: 'sample_template.xml'
            })
        });

        if (conversionResponse.ok) {
            const conversionData = await conversionResponse.json();
            console.log('Conversion Result:');
            console.log('Success:', conversionData.success);
            console.log('Original Records:', conversionData.originalRecords);
            console.log('Template Used:', conversionData.template);
            console.log('TerraFusion Format:', conversionData.terrafusionFormat);
            
            if (conversionData.processedData) {
                console.log('\nProcessed Data Sample:');
                console.log(JSON.stringify(conversionData.processedData.slice(0, 2), null, 2));
            }
        } else {
            const errorData = await conversionResponse.json();
            console.log('Conversion Error:', errorData);
            
            if (errorData.error && errorData.error.includes('Rust agent')) {
                console.log('\n📝 Note: Rust agent may need to be built. This is normal on first run.');
                console.log('The agent uses a fallback JavaScript implementation when Rust is not available.');
            }
        }

        // 3. Test CSV data conversion
        console.log('\n3. Testing CSV Data Conversion...');
        const csvData = [
            ["address", "price", "sqft", "bedrooms"],
            ["321 Elm St, San Antonio TX", "275000", "1600", "3"],
            ["654 Maple Ln, Fort Worth TX", "410000", "2100", "4"]
        ];

        const csvResponse = await fetch(`${baseUrl}/api/conversion/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                csvData: csvData,
                templateName: 'sample_template.xml'
            })
        });

        if (csvResponse.ok) {
            const csvResult = await csvResponse.json();
            console.log('CSV Conversion Success:', csvResult.success);
            console.log('Records Processed:', csvResult.originalRecords);
        } else {
            const csvError = await csvResponse.json();
            console.log('CSV Conversion Error:', csvError);
        }

        console.log('\n✅ Universal Conversion Agent integration test completed!');
        console.log('\n🔗 Available Endpoints:');
        console.log('• GET  /api/conversion/health - Check agent status');
        console.log('• POST /api/conversion/property - Convert property data');
        console.log('• POST /api/conversion/convert - Convert CSV data');
        
    } catch (error) {
        console.error('Test error:', error.message);
        console.log('\n💡 Make sure the TerraFusion server is running on port 5000');
    }
}

// Run the test
if (require.main === module) {
    testUniversalConversionAgent();
}

module.exports = { testUniversalConversionAgent };