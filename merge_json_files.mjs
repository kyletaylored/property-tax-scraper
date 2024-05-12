// Import necessary modules
import fs from 'fs';
import path from 'path';

// Input directory containing multiple JSON files
const inputDirectory = './json_files';
// Output file where the merged results will be saved
const outputFile = './comp_results.json';

// Utility function to convert a currency string to a number
function parseCurrency(currencyStr) {
    // Remove any non-numeric characters except the decimal point
    return parseFloat(currencyStr.replace(/[$,]/g, ''));
}

// Function to merge and filter JSON files
async function mergeAndFilterJsonFiles(directory) {
    let mergedResults = [];
    let count = 0;

    const propertyIDs = [
        104038,
        104035,
        104036,
        104015,
        104027,
        104013,
        104028,
        184653,
        23001,
        117085,
        28608
    ];

    // Read all files in the input directory
    const files = await fs.promises.readdir(directory);
    for (const file of files) {
        // Only process JSON files
        if (path.extname(file) === '.json') {
            const filePath = path.join(directory, file);

            // Read and parse each JSON file
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            // Extract resultsList, parse, and filter the properties
            if (Array.isArray(jsonData.resultsList)) {
                jsonData.resultsList.forEach((property) => {
                    // Extract and convert the appraised value to a number
                    const appraisedValue = parseCurrency(property.appraisedValueDisplay);

                    // // Check if the appraised value falls between 200,000 and 500,000
                    // if (appraisedValue >= 300000 && appraisedValue <= 600000) {
                    //     // Add the numeric appraised value to the property object
                    //     property.appraisedValue = appraisedValue;
                    //     mergedResults.push(property);
                    //     count++; // Increment the count of valid properties
                    // }

                    const propertyId = Number.parseInt(property.propertyId);
                    
                    // process.exit();

                    if (propertyIDs.includes(propertyId)) {
                        property = cleanUpPropertyData(property);
                        count++; // Increment the count of valid properties
                        mergedResults.push({ ...property, appraisedValue: appraisedValue });
                    }
                });
            }
        }
    }

    // Write the merged results to the output file
    await fs.promises.writeFile(outputFile, JSON.stringify(mergedResults, null, 4), 'utf8');
    console.log(`Filtered ${count} properties from ${files.length} JSON files and saved to ${outputFile}`);
}

/**
 * 
 * @param {*} property 
 * @returns 
 */
function cleanUpPropertyData(property) {
    // Normalize text fields and remove unwanted characters
    property.propertyTypeCode = property.propertyTypeCode.trim();
    property.address = property.address.replace(/\r\n/g, ', ').trim();
    property.mapAddress = property.mapAddress.replace(/\s*,\s*/g, ', ').trim();
    property.appraisedValueDisplay = property.appraisedValueDisplay.replace(/[$,]/g, '');

    // Convert numeric strings to numbers
    if (typeof property.appraisedValueDisplay === 'string' && property.appraisedValueDisplay.length) {
        property.appraisedValue = parseFloat(property.appraisedValueDisplay);
    }
    property.percentOwnership = parseFloat(property.percentOwnership);

    // Ensure proper integers
    property.propertyId = parseInt(property.propertyId, 10);
    property.ownerId = parseInt(property.ownerId, 10);
    property.streetNumber = parseInt(property.streetNumber, 10);

    // Cleanup potentially undefined or null fields
    ['doingBusinessAs', 'abstract', 'mobileHomePark', 'condo', 'extensionGrantedDate', 'renditionDeadlineDate', 'onlineFormsUrl'].forEach(field => {
        if (!property[field]) {
            property[field] = '';  // Assign an empty string if the field is null or undefined
        }
    });

    // Convert 'true' or 'false' strings to boolean, if necessary
    ['useOwnerId', 'taxesPaid', 'hasBaseTax', 'inCart', 'forceHideValues', 'isCollectionsOnly', 'hideValues'].forEach(field => {
        if (typeof property[field] === 'string') {
            property[field] = property[field].toLowerCase() === 'true';
        }
    });

    // Simplify array fields to remove empty strings
    if (Array.isArray(property.groupCode) && property.groupCode.length === 1 && property.groupCode[0] === '') {
        property.groupCode = [];
    }

    return property;
}

// Execute the function to merge and filter files in the specified directory
mergeAndFilterJsonFiles(inputDirectory).catch(console.error);
