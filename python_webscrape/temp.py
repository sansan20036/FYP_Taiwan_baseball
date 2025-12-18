import xml.etree.ElementTree as ET
import json
import re
import os

# === Path to your XML file ===
xml_path = r"E:\\Code\\FYP\\scraped_data_2025_07_14\\www_cpbl_com_tw_.xml"
remove_words = ['standing','2025 上半季', '2025 下半季', 'Catogory', "球隊", "排名", "投手TOP5", "打擊TOP5", "更多資訊", "投手", "打擊", "防禦率", "勝投", "救援成功", "中繼成功", "奪三振", "打擊率", "安打", "全壘打", "打點", "盜壘", '出賽數', '勝-敗-和', '勝率', '勝差', '連勝/連敗', 'pitching leaders', 'batting leaders', 'news', '最新消息']

# === Load XML ===
tree = ET.parse(xml_path)
root = tree.getroot()
content = root.find('content').text.strip()
web_url = root.find('url').text.strip()

taiwan_team_chinese_names = ['統一7-ELEVEn獅', '中信兄弟', '樂天桃猿', '台鋼雄鷹', '富邦悍將', '味全龍']
taiwan_team_chinese_names_bracket = ['(' + name + ')' for name in taiwan_team_chinese_names]
content_lines = content.split('\n')

# === Extract Standing ===
def standing_search(lines):
    result, row = [], []
    start = lines.index("standing")
    end = lines.index("pitching leaders")
    for i in range(start, end):
        line = lines[i].strip()
        if line in remove_words:
            continue
        if line == '排名':
            if row: result.append(row)
            row = ['Catogory']
        elif re.fullmatch(r'^[0-9]', line) and lines[i + 1] in taiwan_team_chinese_names:
            if row: result.append(row)
            row = [line]
        else:
            row.append(line)
    if row: result.append(row)
    return result

# === Extract Pitching Leaders ===
def pitching_leaders_search(lines):
    result, row = [], []
    start = lines.index("pitching leaders")
    end = lines.index("batting leaders")
    categories = ['防禦率', '勝投', '救援成功', '中繼成功', '奪三振']
    for i in range(start, end):
        line = lines[i].strip()
        if line in remove_words:
            continue
        
        if line in categories:
            if row: result.append(row)
            result.append(['投手TOP5', line])
            row = []
        elif line in ['1', '2', '3', '4', '5']:
            if row: result.append(row)
            row = [line]
        elif line:
            row.append(line)
            if len(row) == 5 and row[-2] in taiwan_team_chinese_names_bracket:
                result.append(row)
                row = []
    if row: result.append(row)
    return result

# === Extract Batting Leaders ===
def batting_leaders_search(lines):
    result, row = [], []
    start = lines.index("batting leaders")
    try: end = lines.index("news")
    except: end = len(lines)
    categories = ['打擊率', '安打', '全壘打', '打點', '盜壘']
    for i in range(start, end):
        line = lines[i].strip()
        if line in remove_words:
            continue
        if line in categories:
            if row: result.append(row)
            result.append(['打擊TOP5', line])
            row = []
        elif line in ['1', '2', '3', '4', '5']:
            if row: result.append(row)
            row = [line]
        elif line:
            row.append(line)
            if len(row) == 5:
                result.append(row)
                row = []
    if row: result.append(row)
    return result

# === Final JSON Data ===
output_data = {
    "web_url": web_url,
    "standing": standing_search(content_lines),
    "pitching_leaders": pitching_leaders_search(content_lines),
    "batting_leaders": batting_leaders_search(content_lines),
}


# === Save JSON File (Create if None) ===
output_file = r"E:\Code\FYP\main_page_output.json"

# Create empty file if it doesn't exist
if not os.path.exists(output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({}, f, ensure_ascii=False, indent=2)

# Now write the actual content
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print("✅ JSON written to:", output_file)
