<script>
const attributeSelect = document.getElementById('attributeSelect');

const attributeOptions = ['Attacking', 'Skills', 'Movement', 'Power', 'Mentality', 'Defending', 'Goalkeeping'];

// Add options to the select attribute element
attributeOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.toLowerCase(); // Set option value
    optionElement.textContent = option; // Set option text
    attributeSelect.appendChild(optionElement); // Append the option to the select element
});


let clickCount = 0;
let index = 1;

function addPlayerSelector() {
    clickCount++;
    if (clickCount <= 2) {
        if(clickCount == 2) {
            document.getElementById('addPlayerButton').style.display = 'none';
        }
        const additionalSelectors = document.getElementById('additionalSelectors');
        index += 1;
        if (additionalSelectors.children.length === 0) {
            index = 1;
        }

        const row = document.createElement('div');
        row.classList.add('row', 'mt-2');

        const col = document.createElement('div');
        col.classList.add('col-md-6');

        const teamLabel = document.createElement('label');
        teamLabel.htmlFor = `teamSelect${index}`;
        teamLabel.classList.add('form-label');
        teamLabel.textContent = 'Select Team:';
        col.appendChild(teamLabel);

        const teamSelect = document.createElement('select');
        teamSelect.id = `teamSelect${index}`;
        teamSelect.classList.add('form-select');
        col.appendChild(teamSelect);

        row.appendChild(col);

        const col2 = document.createElement('div');
        col2.classList.add('col-md-6');

        const playerLabel = document.createElement('label');
        playerLabel.htmlFor = `playerSelect${index}`;
        playerLabel.classList.add('form-label');
        playerLabel.textContent = 'Select Player:';
        col2.appendChild(playerLabel);

        const playerSelect = document.createElement('select');
        playerSelect.id = `playerSelect${index}`;
        playerSelect.classList.add('form-select');
        col2.appendChild(playerSelect);

        row.appendChild(col2);

        additionalSelectors.appendChild(row);

        populateTeamDropdown(index);
        attachTeamChangeEvent(index);

        if (clickCount === 1 || clickCount === 2) {
            const removePlayerButton = document.createElement('button');
            removePlayerButton.classList.add('btn', 'btn-danger', 'mt-2');
           
            removePlayerButton.style.width = 'auto'; 
            removePlayerButton.style.margin = 'auto';

            removePlayerButton.textContent = 'Remove Player';
            removePlayerButton.onclick = function () {
                additionalSelectors.removeChild(row);
                clickCount--;
                if (clickCount === 1) {
                    document.getElementById('addPlayerButton').style.display = 'block';
                    document.getElementById('addPlayerButton').style.margin = '0 auto';
                }
            };
            row.appendChild(removePlayerButton);
        }
    }
}

function attachTeamChangeEvent(index) {
    const teamSelect = document.getElementById(`teamSelect${index}`);
    teamSelect.addEventListener('change', () => populatePlayerDropdown(teamSelect.value, index));
}

async function fetchPlayerData() {
    try {
        const response = await fetch('../../data/all_pl_player_data.json');
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not in JSON format');
        }
        const teamData = await response.json();

        for (const team in teamData) {
            for (const player in teamData[team]) {
                try {
                    const playerData = JSON.parse(teamData[team][player].replace(/'/g, '"'));
                    teamData[team][player] = playerData;
                } catch (error) {
                    console.error(`Error parsing player data for ${player} in team ${team}:`, error);
                }
            }
        }

        return teamData;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error; // Propagate the error if necessary
    }
}

async function populateTeamDropdown(index) {
    const teamData = await fetchPlayerData();
    const teamSelect = document.getElementById(`teamSelect${index}`);

    for (const team in teamData) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    }

    teamSelect.addEventListener('change', () => populatePlayerDropdown(teamData, index));
    populatePlayerDropdown(teamData, index);
}

function populatePlayerDropdown(teamData, index) {
    const teamSelect = document.getElementById(`teamSelect${index}`);
    const selectedTeam = teamSelect.value;
    const playerSelect = document.getElementById(`playerSelect${index}`);
    playerSelect.innerHTML = '';

    const teamPlayers = teamData[selectedTeam];
    if (teamPlayers) {
        for (const player in teamPlayers) {
            const playerName = player;
            const option = document.createElement('option');
            option.value = playerName;
            option.textContent = playerName;
            playerSelect.appendChild(option);
        }
    }
}

const addPlayerButton = document.getElementById('addPlayerButton');
addPlayerButton.addEventListener('click', addPlayerSelector);

populateTeamDropdown(0);


function createRadarChart() {
    const selectedPlayers = [];
    const selectedAttribute = document.getElementById('attributeSelect').value;

    const initialPlayerSelect = document.getElementById('playerSelect0');
    const initialTeamSelect = document.getElementById('teamSelect0');
    selectedPlayers.push({
        team: initialTeamSelect.value,
        name: initialPlayerSelect.value
    });

    const additionalSelectors = document.getElementById('additionalSelectors');
    const playerSelects = additionalSelectors.querySelectorAll('[id^=playerSelect]');
    const teamSelects = additionalSelectors.querySelectorAll('[id^=teamSelect]');
    playerSelects.forEach((playerSelect, index) => {
        selectedPlayers.push({
            team: teamSelects[index].value,
            name: playerSelect.value
        });
    });

    const attributeToSend = selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1);
    generateRadarChart(selectedPlayers, attributeToSend);
}



const createRadarChartButton = document.getElementById('createRadarChartButton');
createRadarChartButton.addEventListener('click', createRadarChart);


async function generateRadarChart(players, attribute) {
    const predefinedColors = [
        'rgba(255, 99, 132, 0.5)', 
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)', 
    ];
    const colors = predefinedColors.slice(0, players.length);

    const allPlayerData = await fetchPlayerData(); 

    const firstPlayerAttributes = allPlayerData[players[0].team][players[0].name][attribute];
    const firstPlayerAttributesKeys = (Object.keys(firstPlayerAttributes))
    const data = {
        labels: firstPlayerAttributesKeys,
        datasets: []
    };

    players.forEach((player, index) => {
        const playerAttributes = Object.values(allPlayerData[player.team][player.name][attribute])
        const playerAttributesValues =  Object.values(playerAttributes);
        const dataset = {
            label: player.name,
            backgroundColor: colors[index % colors.length],
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 2,
            data: playerAttributes
        };
        data.datasets.push(dataset); // Add dataset for each player
    });
    console.log(data);


    // Configure radar chart options
    const options = {
    scale: {
        ticks: {
            beginAtZero: true,
            max: 99,
            fontSize: 30, // Adjust the font size incrementally
            fontWeight: 'bold',
            fontColor: 'rgba(255, 255, 255)'
        },
        angleLines: {
            lineWidth: 2, // Adjust the width of the radial lines incrementally
            color: 'rgba(255, 255, 255)'
        },
        gridLines: {
            color: 'rgba(255, 255, 255)',
            lineWidth: 2 // Adjust the width of the circular grid lines incrementally
        }
    }
};



    // Create the radar chart
    const radarChartContext = document.getElementById('radarChart').getContext('2d');
    const radarChart = new Chart(radarChartContext, {
        type: 'radar',
        data: data,
        options: options
    });

    const chartDataString = encodeURIComponent(JSON.stringify({
    data: data,
    options: options
    }));

// Redirect to the new HTML page with the chart data in the query parameter
    window.location.href = `./radarChart?chartData=${chartDataString}`;
}
</script>