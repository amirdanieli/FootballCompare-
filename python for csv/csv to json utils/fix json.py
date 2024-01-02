import json

file_path = 'C:/Users/Amir Danieli/OneDrive/Documents/Amir/Programing/Football Transfers/python for csv/csv to json utils/pl_player_data.json'

with open(file_path, 'r') as file:
    data = json.load(file)

# Function to fix JSON formatting in the entire data
def fix_json_format(data):
    for team, players in data.items():
        for player_id, player_info in players.items():
            player_data = player_info.get("PlayerData")
            if player_data:
                # Swap single quotes with double quotes to ensure correct JSON formatting
                player_info["PlayerData"] = json.loads(player_data.replace("'", "\""))

    return data


fixed_data = fix_json_format(data)

output_file = "all_pl_player_data.json"
with open(output_file, "w") as file:
    json.dump(fixed_data, file, indent=4)

print(f"Fixed data saved to '{output_file}'.")