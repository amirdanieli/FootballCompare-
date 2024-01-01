import json

with open('pl_player_data.json', 'r') as file:
    data = json.load(file)

# Create a new dictionary with player names as keys and their respective data as values
transformed_data = {
    team: {player_info["Player"]: player_info["PlayerData"] for _, player_info in team_data.items()}
    for team, team_data in data.items()
}

# Write the transformed data to a new JSON file
with open('updated_json.json', 'w') as file:
    json.dump(transformed_data, file, indent=4)

