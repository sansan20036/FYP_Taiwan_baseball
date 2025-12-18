import xml.etree.ElementTree as ET
import re
import os
import firebase_admin
from firebase_admin import credentials, db

# Set the path to your folder
folder_path = 'E:\\Code\\FYP\\scraped_data_2025_07_14'

# Compile a regex pattern to match filenames containing "person" (case-insensitive)
pattern = re.compile(r'person', re.IGNORECASE)

# List all files in the folder
files = os.listdir(folder_path)

# Filter files that match the regex pattern
matching_files = [f for f in files if pattern.search(f)]

text_file = "E:\\Code\\FYP\\members_details.txt"
with open(text_file, "w", encoding="utf-8") as file:
    pass  # clean file

def FireBase_Player(player_data):
    def initialize_firebase():
        if not firebase_admin._apps:
            cred = credentials.Certificate("E:/Code/FYP/firebase_key.json")
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://finalyearproject-5cba9-default-rtdb.asia-southeast1.firebasedatabase.app/'
            })

    def upload_to_firebase(player_data, player_id):
        try:
            ref = db.reference(f"/players/{player_id}")
            ref.set(player_data)
            print(f"[UPLOAD SUCCESS] {player_id}")
        except Exception as e:
            print(f"[UPLOAD FAILED] {player_id}: {e}")

    initialize_firebase()
    player_id = player_data.get("name", "unknown_player").replace(" ", "_")
    upload_to_firebase(player_data, player_id)

def Data_Sorting_player(filename):
    name = ''
    teamfiles = ''

    try:
        tree = ET.parse(f"E:/Code/FYP/scraped_data/{filename}")
    except ET.ParseError:
        try:
            tree = ET.parse(f"E:/Code/FYP/scraped_data_2025_07_14/{filename}")
        except ET.ParseError as e:
            print(f"Error parsing {filename}: {e}")
            return

    root = tree.getroot()
    content = root.find('content').text

    try:
        web_url = root.find('url').text
        print("web_url:", web_url)
    except Exception as e:
        print(f"An error occurred while processing {filename}: {e}")

    team = ''
    taiwan_team_eng_names = ['TSG Hawks', 'U-Lions', 'Guardians', 'Brothers', 'Monkeys', 'DRAGONS']
    lines = content.split('\n')

    for i, line in enumerate(lines):
        if line in taiwan_team_eng_names:
            team = line
            print("team", team)

    content_length = len(lines)

    for i in range(content_length - 1):
        if lines[i] == '個人成績表' and not name:
            name = lines[i - 1]
            number = lines[i + 3]
        elif lines[i] == '位置':
            position = lines[i + 1]
        elif lines[i] == '投打習慣':
            batting_hand = lines[i + 1]
        elif lines[i] == '身高/體重':
            height = lines[i + 1]
        elif lines[i] == '生日':
            birthday = lines[i + 1]
        elif lines[i] == '初出場':
            first_game = lines[i + 1]
        elif lines[i] == '學歷':
            education = lines[i + 1]
            if education == '國籍/出生地':
                education = None
        elif lines[i] == '國籍/出生地':
            birthplace = lines[i + 1]
        elif lines[i] == '原名':
            birthname = lines[i + 1]
            if birthname == '選秀順位':
                birthname = None
        elif lines[i] == '選秀順位':
            draft_position = lines[i + 1]

    for i in range(content_length - 1):
        if lines[i] == '投球成績' or lines[i] == '打擊成績':
            pitch_record_N = i
        if lines[i] == '守備成績':
            defensive_performance_N = i
        if lines[i] == '對戰成績':
            batting_result_N = i

    def filter_by_year(start, end):
        current_row, array = [], []
        for i in range(start + 1, end):
            line = lines[i]
            if re.search(r'\b20\d{2}\b', line) or line == 'TOTAL':
                if current_row:
                    array.append(current_row)
                current_row = [line]
            else:
                current_row.append(line.strip())
        if current_row:
            array.append(current_row)
        return array

    def filter_by_teams(start, end):
        teams = ['樂天桃猿', '中信兄弟', '富邦悍將', '統一7-ELEVEn獅', '味全龍', '衛冕軍', '台鋼雄鷹']
        current_row, array = [], []
        for i in range(start + 1, end):
            line = lines[i]
            if line in teams:
                if current_row:
                    array.append(current_row)
                current_row = [line]
            else:
                current_row.append(line.strip())
        if current_row:
            array.append(current_row)
        return array

    pitch_record = filter_by_year(pitch_record_N, defensive_performance_N)
    defensive_performance = filter_by_year(defensive_performance_N, batting_result_N)
    batting_result = filter_by_teams(batting_result_N, content_length)

    player_data = {
        "web_url": web_url,
        "name": name,
        "number": number,
        "team": team,
        "position": position,
        "batting_hand": batting_hand,
        "height": height,
        "birthday": birthday,
        "first_game": first_game,
        "education": education,
        "birthplace": birthplace,
        "birthname": birthname,
        "draft_position": draft_position,
        "pitch_record": pitch_record,
        "defensive_performance": defensive_performance,
        "batting_result": batting_result
    }

    try:
        with open(text_file, "a", encoding="utf-8") as file:
            for key, value in player_data.items():
                if isinstance(value, list):
                    for row in value:
                        file.write("\t".join(map(str, row)) + "\n")
                else:
                    file.write(f"{key}: \n {value}\n")
            file.write("\n" * 5)
    except Exception as e:
        print(f"An error occurred writing to text file: {e}")

    FireBase_Player(player_data)

if __name__ == "__main__":
    total_amount = 0
    for f in matching_files:
        try:
            Data_Sorting_player(f)
            total_amount += 1
        except Exception as e:
            print(f"An error occurred while processing {f}: {e}")
            continue
    print(f"Total files processed: {total_amount}")
