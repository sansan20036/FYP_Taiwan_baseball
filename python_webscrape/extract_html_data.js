// Extract data from home_page.html and convert to JSON format
// This script should be run in a browser environment with the home_page.html loaded

function extractDataFromHTML() {
    const data = {
        web_url: "https://www.cpbl.com.tw/",
        standing: [],
        pitching_leaders: [],
        batting_leaders: []
    };

    // Extract standings data
    function extractStandings() {
        const standings = [];
        
        // Extract first half standings
        const firstHalfBody = document.getElementById('first-half-body');
        if (firstHalfBody) {
            const rows = firstHalfBody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const teamName = cells[0].querySelector('.text-sm.font-medium')?.textContent || '';
                    const games = cells[1].textContent.trim();
                    const record = cells[2].textContent.trim();
                    const pct = cells[3].textContent.trim();
                    const gb = cells[4].textContent.trim();
                    const streak = cells[5].textContent.trim();
                    
                    standings.push([
                        (index + 1).toString(),
                        teamName,
                        games,
                        record,
                        pct,
                        gb,
                        streak
                    ]);
                }
            });
        }
        
        // Extract second half standings
        const secondHalfBody = document.getElementById('second-half-body');
        if (secondHalfBody) {
            const rows = secondHalfBody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const teamName = cells[0].querySelector('.text-sm.font-medium')?.textContent || '';
                    const games = cells[1].textContent.trim();
                    const record = cells[2].textContent.trim();
                    const pct = cells[3].textContent.trim();
                    const gb = cells[4].textContent.trim();
                    const streak = cells[5].textContent.trim();
                    
                    standings.push([
                        (index + 1).toString(),
                        teamName,
                        games,
                        record,
                        pct,
                        gb,
                        streak
                    ]);
                }
            });
        }
        
        return standings;
    }

    // Extract pitching leaders data
    function extractPitchingLeaders() {
        const pitchingLeaders = [];
        
        // Get all pitching categories
        const categories = ['era', 'wins', 'saves', 'holds', 'strikeouts'];
        
        categories.forEach(category => {
            // Add category header
            const categoryNames = {
                'era': 'ERA',
                'wins': 'Wins', 
                'saves': 'Saves',
                'holds': 'Holds',
                'strikeouts': 'Strikeouts'
            };
            pitchingLeaders.push([categoryNames[category]]);
            
            // Extract players for this category
            const container = document.getElementById('pitching-cards');
            if (container) {
                const cards = container.querySelectorAll('.bg-white.rounded-2xl');
                cards.forEach((card, index) => {
                    const name = card.querySelector('.text-sm.font-medium')?.textContent || '';
                    const team = card.querySelector('.text-xs.text-gray-500')?.textContent || '';
                    const value = card.querySelector('.text-2xl.font-bold')?.textContent || '';
                    
                    if (name && team && value) {
                        const teamMatch = team.match(/\((.*?)\)/);
                        const teamName = teamMatch ? teamMatch[1] : team;
                        
                        pitchingLeaders.push([
                            (index + 1).toString(),
                            name,
                            `(${teamName})`,
                            value
                        ]);
                    }
                });
            }
        });
        
        return pitchingLeaders;
    }

    // Extract batting leaders data
    function extractBattingLeaders() {
        const battingLeaders = [];
        
        // Get all batting categories
        const categories = ['avg', 'hits', 'hr', 'rbi', 'sb'];
        
        categories.forEach(category => {
            // Add category header
            const categoryNames = {
                'avg': 'AVG',
                'hits': 'Hits',
                'hr': 'HR', 
                'rbi': 'RBI',
                'sb': 'SB'
            };
            battingLeaders.push([categoryNames[category]]);
            
            // Extract players for this category
            const container = document.getElementById('batting-cards');
            if (container) {
                const cards = container.querySelectorAll('.bg-white.rounded-2xl');
                cards.forEach((card, index) => {
                    const name = card.querySelector('.text-sm.font-medium')?.textContent || '';
                    const team = card.querySelector('.text-xs.text-gray-500')?.textContent || '';
                    const value = card.querySelector('.text-2xl.font-bold')?.textContent || '';
                    
                    if (name && team && value) {
                        const teamMatch = team.match(/\((.*?)\)/);
                        const teamName = teamMatch ? teamMatch[1] : team;
                        
                        battingLeaders.push([
                            (index + 1).toString(),
                            name,
                            `(${teamName})`,
                            value
                        ]);
                    }
                });
            }
        });
        
        return battingLeaders;
    }

    // Extract data
    data.standing = extractStandings();
    data.pitching_leaders = extractPitchingLeaders();
    data.batting_leaders = extractBattingLeaders();

    return data;
}

// Function to download JSON file
function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Main execution function
function main() {
    try {
        console.log('Extracting data from HTML...');
        const extractedData = extractDataFromHTML();
        
        console.log('Extracted data:', extractedData);
        
        // Download the JSON file
        downloadJSON(extractedData, 'home_page_output.json');
        
        console.log('Data extraction completed! File saved as home_page_output.json');
        
        return extractedData;
    } catch (error) {
        console.error('Error extracting data:', error);
        return null;
    }
}

// Auto-execute if running in browser
if (typeof window !== 'undefined') {
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractDataFromHTML, main };
} 