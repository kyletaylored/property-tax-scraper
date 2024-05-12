import axios from 'axios';
import cheerio from 'cheerio';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readFile, mkdir, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const limit = pLimit(5);  // Limiting the number of parallel requests

async function readJsonFile(fileName) {
    const newFilePath = resolve(__dirname, fileName);
    const data = await readFile(newFilePath, 'utf8');
    return JSON.parse(data);
}

async function scrapePropertyDetails(url) {
    try {
        const htmlContent = await fetchOrLoadCachedHtml(url);
        const $ = cheerio.load(htmlContent, null, false);

        // Extract Class CD and Number of Improvements
        const improvementPanel = $('div.panel').has('.panel-heading:contains("Property Improvement - Building")');
        console.log(improvementPanel.html());
        const classCd = improvementPanel.find('tr').eq(1).find('td').eq(2).text().trim();
        const numberOfImprovements = improvementPanel.find('tr').length - 1;

        // Extract Acreage
        const landPanel = $('div.panel').has('.panel-heading:contains("Property Land")');
        const acreage = landPanel.find('tr').eq(1).find('td').eq(2).text().trim();

        // Extract Property Roll Value History
        const historyPanel = $('.panel').has('.panel-heading:contains("Property Roll Value History")');
        let rollValueHistory = {};
        historyPanel.find('tr').slice(1).each((index, element) => {
            const year = $(element).find('td').eq(0).text().trim();
            const values = $(element).find('td').slice(1).map((i, el) => $(el).text().trim()).get();
            rollValueHistory[year] = values;
        });

        return {
            classCd,
            numberOfImprovements,
            acreage,
            rollValueHistory
        };
    } catch (error) {
        console.error(`Error fetching or parsing data from ${url}: ${error.message}`);
        return null;
    }
}

// Define a function to get or cache HTML
async function fetchOrLoadCachedHtml(url, cacheDir = './html_cache') {
    const urlHash = encodeURIComponent(url);
    const filePath = join(cacheDir, urlHash);

    try {
        // Try to read from cache
        const cachedHtml = await readFile(filePath, 'utf8');
        console.log('Loaded from cache:', url);
        return cachedHtml;
    } catch (error) {
        // If no cache found, fetch and cache the HTML
        const response = await axios.get(url);
        const htmlData = response.data;

        // Ensure cache directory exists
        await mkdir(cacheDir, { recursive: true });

        // Write the new HTML to cache
        await writeFile(filePath, htmlData, 'utf8');
        console.log('Fetched and cached:', url);
        return htmlData;
    }
}

async function main(jsonFileName) {
    const properties = await readJsonFile(jsonFileName);
    console.log(properties);
    const requests = properties.map(property => 
        limit(() => scrapePropertyDetails(`https://esearch.dentoncad.com${property.detailUrl}`))
    );

    const results = await Promise.all(requests);
    console.log(JSON.stringify(results, null, 4));
}

main('comp_results.json');
