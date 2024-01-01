import pandas as pd
import json
import os

# Directory where your CSV files are located
directory = os.getcwd()

# Initialize an empty dictionary to store team data
team_data = {}

# Iterate through each CSV file in the directory
for filename in os.listdir(directory):
    if filename.endswith(".csv"):
        team_name = filename.split('_')[0]  # Extract team name from the file name
        file_path = os.path.join(directory, filename)

        # Read the CSV file into a pandas DataFrame
        df = pd.read_csv(file_path)

        # Convert DataFrame to dictionary
        player_data = df.to_dict(orient='index')

        # Store the player data in the team_data dictionary
        team_data[team_name] = player_data

# Write the team data to a JSON file
with open('team_player_data.json', 'w') as json_file:
    json.dump(team_data, json_file, indent=4)
