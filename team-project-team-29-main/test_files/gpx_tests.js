let successfulFileCount = 0;
let incorrectFileCount = 0;
let successfulDisplayCount = 0;

async function uploadAndParseFile(fileName) {
    return new Promise((resolve, reject) => {
        const filePath = `static/${fileName}`;
        console.log('Attempting to fetch file:', filePath);
        // Check if file exists
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    // Catch any error finding file
                    console.error('File not found:', fileName);
                    incorrectFileCount++;
                    return null;
                }
                return response.blob();
            })
            .then(blob => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                console.log('File fetched successfully:', fileName);
                // If it exists then read its data
                const reader = new FileReader();
                reader.onload = function(event) {
                    console.log('File loaded successfully:', fileName);
                    successfulFileCount++;
                    try {
                        // Attempt to parse the gpx data from the file
                        const gpxData = event.target.result;
                        parseGPXAndDisplay(gpxData);
                        const accordionItem = document.querySelector('.accordion-item');
                        if (!accordionItem) {
                            throw new Error(`Accordion item not found after parsing ${fileName}`);
                        }
                        else{
                            successfulDisplayCount++;
                        }
                        resolve(fileName);
                    } catch (error) {
                        // Catch any error found whilst parsing
                        console.error('Error parsing GPX data:', fileName, error);
                        incorrectFileCount++;
                        resolve(null);
                    }
                };
                reader.onerror = function(event) {
                    // Catch any error reading file
                    console.error('Error reading file:', fileName, event.target.error);
                    incorrectFileCount++;
                    resolve(null);
                };
                reader.readAsText(blob);
            })
            .catch(error => {
                // Catch any error fetching the file
                console.error('Error fetching file:', fileName, error);
                incorrectFileCount++;
                resolve(null);
            });
    });
}

// List of existing gpx files
const correctFiles = [
    'route1.gpx',
    'route2.gpx',
    'correct1.gpx',
    'correct2.gpx',
    'correct3.gpx',
    'correct4.gpx',
    'correct5.gpx',
    'correct6.gpx'
];

// List of non-existent or incorrect gpx files
const incorrectFiles = [
    'incorrect_file1.gpx',
    'incorrect_file2.gpx',
    'incorrect3.gpx',
    'incorrect4.gpx',
];

// Test the correct gpx files and see how many are successful
const correctResults = await Promise.all(correctFiles.map(uploadAndParseFile))
    .then(results => {
        return results.filter(result => result !== null);
    });
console.log("Total correct gpx files:", correctFiles.length)
console.log('Successfully parsed GPX files:', successfulFileCount,'/',correctFiles.length);
console.log('Successfully displayed GPX routes:', successfulDisplayCount,'/',correctFiles.length);

// Test the incorrect gpx files and see how many failed
const incorrectResults = await Promise.all(incorrectFiles.map(uploadAndParseFile))
    .then(results => {
        return results.filter(result => result === null);
    });
console.log("Total incorrect gpx files:", incorrectFiles.length)
console.log('Unsuccessful GPX files:', incorrectFileCount);

