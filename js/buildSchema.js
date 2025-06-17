import fs from 'fs';
import path from 'path';

async function getAPIData() {
    try {
        const response = await fetch('https://unstats.un.org/sdgapi/v1/sdg/Indicator/List');
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('SDG Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function getSeriesData(indicatorCode) {
    try {
        const response = await fetch(`https://unstats.un.org/sdgapi/v1/sdg/Indicator/${indicatorCode}/Series/List`);
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.series || [];
    } catch (error) {
        console.error(`Error fetching series data for ${indicatorCode}:`, error);
        return [];
    }
}

async function buildSchemaFromSDGData(sdgData) {
    const schema = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "title": "SDG Project Assessment Form",
        "description": "Assessment form to determine which Sustainable Development Goals your project addresses",
        "type": "object",
        "properties": {
            "items": {}
        },
        "required": [],
        "additionalProperties": false
    };

    const properties = {};

    properties.projectName = {
        "type": "string",
        "description": "Name of your project"
    };

    properties.projectDescription = {
        "type": "string",
        "description": "Brief description of your project"
    };

    schema.required.push("projectName", "projectDescription");

    for (const indicator of sdgData) {
        console.log(`Processing indicator ${indicator.code}!`);
        
        const fieldKey = `sdg_${indicator.code.replace(/\./g, '_')}`;
        
        properties[`Does your project address: ${indicator.description}`] = {
            "type": "boolean",
            "description": `Goal ${indicator.goal}, Target ${indicator.target}`
        };

        if (indicator.series && indicator.series.length > 0) {
            try {
                const seriesData = await getSeriesData(indicator.code);
                
                if (seriesData.length > 0) {
                    seriesData.forEach((series, index) => {
                        const seriesKey = `${fieldKey}_series_${index + 1}`;
                        
                        properties[`Does your project address: ${series.description}`] = {
                            "type": "boolean",
                            "description": `Series ${index + 1} of indicator ${indicator.code}?`
                        };
                    });
                }
            } catch (error) {
                console.error(`Error processing series for ${indicator.code}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    schema.properties.items = properties;
    
    return schema;
}

async function writeJSONFile(schema) {
    try {
        const filePath = path.join('../schemas', 'input.json');
        const schemaString = JSON.stringify(schema, null, 2);
        
        fs.writeFileSync(filePath, schemaString, 'utf8');
        console.log("Schema has been succesfully updated!");
    } catch (error) {
        console.error('Error writing schema file:', error);
        throw error;
    }
}

async function buildSchema() {
    try {
        const apiData = await getAPIData();
        const schema = await buildSchemaFromSDGData(apiData);
        
        await writeJSONFile(schema);
        
        return schema;
    } catch (error) {
        console.error('Error building schema:', error);
        throw error;
    }
}

buildSchema().catch(console.error);
