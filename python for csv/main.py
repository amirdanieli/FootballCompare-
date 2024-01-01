import csv
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import glob
import pandas as pd

chrome_options = webdriver.ChromeOptions()
chrome_options.add_experimental_option("detach", True)

driver = webdriver.Chrome(options=chrome_options)

driver.get("https://sofifa.com/league/13")


def handle_consent():
    try:
        consent_button = driver.find_element(By.XPATH, "//button[@aria-label='Consent']")
        consent_button.click()
    except Exception as e:
        print(f"An error occurred while handling the consent button: {e}")


def create_section_dict(section) -> dict:
    section_dict = {}
    paras = section.find_elements(By.CSS_SELECTOR, 'p')

    for p in paras:
        try:
            attribute_element = p.find_element(By.CSS_SELECTOR, 'span')
            attribute = attribute_element.text
        except NoSuchElementException:
            attribute = None  # Set attribute to None if 'span' element is not found

        try:
            value_element = p.find_element(By.CSS_SELECTOR, 'em')
            value = value_element.text
        except NoSuchElementException:
            value = None
        section_dict[attribute] = value

    return section_dict


def find_element_retry(driverSent, by, selector, max_retries=3):
    retries = 0
    while retries < max_retries:
        try:
            element = WebDriverWait(driverSent, 10).until(
                EC.presence_of_element_located((by, selector))
            )
            return element
        except NoSuchElementException as e:
            print(f"Attempt {retries + 1} failed. Error: {e}")
            retries += 1
    return None


def create_player_dict(href) -> dict:
    driver.get(href)

    Attacking = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[6]/div[1]')
    if Attacking:
        attack_dict = create_section_dict(Attacking)
    else:
        attack_dict = None  # Set to None if element not found after retries

    Skill = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[6]/div[2]')
    if Skill:
        skill_dict = create_section_dict(Skill)
    else:
        skill_dict = None

    Movement = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[6]/div[3]')
    if Movement:
        movement_dict = create_section_dict(Movement)
    else:
        movement_dict = None

    Power = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[6]/div[4]')
    if Power:
        power_dict = create_section_dict(Power)
    else:
        power_dict = None

    Mentality = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[7]/div[1]')
    if Mentality:
        mentality_dict = create_section_dict(Mentality)
    else:
        mentality_dict = None

    Defending = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[7]/div[2]')
    if Defending:
        defending_dict = create_section_dict(Defending)
    else:
        defending_dict = None

    Goalkeeping = find_element_retry(driver, By.XPATH, '//*[@id="body"]/main[1]/article/div[7]/div[3]')
    if Goalkeeping:
        goalkeeping_dict = create_section_dict(Goalkeeping)
    else:
        goalkeeping_dict = None

    return {
        "Attacking": attack_dict,
        "Skills": skill_dict,
        "Movement": movement_dict,
        "Power": power_dict,
        "Mentality": mentality_dict,
        "Defending": defending_dict,
        "Goalkeeping": goalkeeping_dict
    }


def get_player_href(playerTable) -> dict:
    player_rows = playerTable.find_elements(By.TAG_NAME, 'tr')
    temp_dict = {}
    players_hrefs = {}
    # Iterate through each <tr> element
    for row in player_rows:
        try:
            # Find all <td> elements within the current row
            columns = row.find_elements(By.TAG_NAME, 'td')

            # Check if the row has at least two <td> elements
            if len(columns) >= 2:
                # Get the second <td> element and retrieve its href attribute
                second_td = columns[1]
                link_element = second_td.find_element(By.TAG_NAME, 'a')
                href_value = link_element.get_attribute('href')

                player_name = href_value.split('/')[-3]
                temp_dict[player_name] = href_value

        except Exception as e:
            print(f"An error occurred: {e}")

    for player in temp_dict:
        players_hrefs[player] = create_player_dict(temp_dict[player])

    return players_hrefs


all_teams = driver.find_element(by=By.ID, value="similar")

child_divs = all_teams.find_elements(By.XPATH, ".//div")

teams_dict = {}

for div in child_divs:
    team_link = div.find_element(By.XPATH, ".//a[starts-with(@href, '/team/')]")
    team_href = team_link.get_attribute("href")

    team_name = team_href.split('/')[-2]

    if team_name not in teams_dict:
        teams_dict[team_name] = team_href

count = 0

final_dict = {}
for team in teams_dict:
    driver.get(teams_dict[team])

    if count == 0:
        time.sleep(2)
        handle_consent()
        count += 1

    player_table = driver.find_element(By.XPATH, '//*[@id="body"]/main[2]/article/table[1]/tbody')
    final_dict[team] = get_player_href(player_table)

    csv_file_path = f"{team}_player_data.csv"
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
        csv_writer = csv.writer(csv_file)
        csv_writer.writerow(["Player", "PlayerData"])  # Write header
        for player, data in final_dict[team].items():
            csv_writer.writerow([player, data])

csv_files = glob.glob("*_player_data.csv")

# Merge all CSV files into one big CSV file
all_data = pd.concat((pd.read_csv(file) for file in csv_files))

# Write the merged data into a single CSV file
merged_csv_path = "all_teams_player_data.csv"
all_data.to_csv(merged_csv_path, index=False)

driver.quit()
