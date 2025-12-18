import xml.etree.ElementTree as ET
import re

text_file = "E:\\Code\\FYP\\main_page.txt.txt"
with open(text_file, "w", encoding="utf-8") as file:
    pass  # clean file

taiwan_team_chinese_names = ['統一7-ELEVEn獅', '中信兄弟', '樂天桃猿', '台鋼雄鷹', '富邦悍將', '味全龍']
taiwan_team_chinese_names_bracket = ['(統一7-ELEVEn獅)', '(中信兄弟)', '(樂天桃猿)', '(台鋼雄鷹)', '(富邦悍將)', '(味全龍)']


def Data_Sorting_mainpage():
    try:
        tree = ET.parse("E:\\Code\\FYP\\scraped_data_2025_07_14\\www_cpbl_com_tw_.xml")
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")
        return

    root = tree.getroot()
    content = root.find('content').text

    try:
        web_url = root.find('url').text
        print("web_url:", web_url)
    except Exception as e:
        print(f"An error occurred while processing: {e}")

    content_lines = content.split('\n')
    content_length = len(content_lines)

    def standing_search(content):
        lines = content.split('\n')
        current_row = []
        array = []

        for i in range(content_length):
            if lines[i] == 'standing':
                standing_start = i
            if lines[i] == 'pitching leaders':
                standing_end = i
                break

        for i in range(standing_start, standing_end):
            line = lines[i].strip()
            if line == '更多資訊':
                break
            if line == '排名':
                if current_row:
                    array.append(current_row)
                current_row = ['Catogory']
            if re.fullmatch(r'^[0-9]', line) and lines[i + 1] in taiwan_team_chinese_names:
                if current_row:
                    array.append(current_row)
                current_row = [line]
            else:
                current_row.append(line)
        if current_row:
            array.append(current_row)
        return array

    def pitching_leaders_search(content):
        lines = content.split('\n')
        start = lines.index('pitching leaders')
        end = lines.index('batting leaders')
        data_lines = lines[start:end]

        categories = ['防禦率', '勝投', '救援成功', '中繼成功', '奪三振']
        output = []
        row = []

        for line in data_lines:
            line = line.strip()
            if line in ['1', '2', '3', '4', '5']:
                if row:
                    output.append(row)
                    row = []
                row.append(line)
            if line in categories:
                if row:
                    output.append(row)
                    row = []
                output.append(['投手TOP5', line])
                continue
            if line == '更多資訊':
                continue
            if line:
                row.append(line)
                if len(row) == 5 and (row[0] in ['1', '2', '3', '4', '5'] and row[3] in taiwan_team_chinese_names):
                    output.append(row)
                    row = []
        if row:
            output.append(row)
        return output

    def batting_leaders_search(content):
        lines = content.split('\n')
        start = lines.index('batting leaders')
        try:
            end = lines.index('news')  # clean end
        except:
            end = len(lines)

        data_lines = lines[start:end]
        categories = ['打擊率', '安打', '全壘打', '打點', '盜壘']
        output = []
        row = []

        for line in data_lines:
            line = line.strip()
            if line == '更多資訊':
                break
            if line in ['1', '2', '3', '4', '5']:
                if row:
                    output.append(row)
                    row = []
                row.append(line)
            if line in categories:
                if row:
                    output.append(row)
                    row = []
                output.append(['打擊TOP5', line])
                continue
            if line == '更多資訊':
                continue
            if line:
                row.append(line)
                if len(row) == 5:
                    output.append(row)
                    row = []
        if row:
            output.append(row)
        return output

    # Process and print
    print("===== Standing Result =====")
    standing_result = standing_search(content)
    for row in standing_result:
        print(row)

    print("\n===== Pitching Leaders Result =====")
    pitching_result = pitching_leaders_search(content)
    for row in pitching_result:
        print(row)

    print("\n===== Batting Leaders Result =====")
    batting_result = batting_leaders_search(content)
    for row in batting_result:
        print(row)


if __name__ == "__main__":
    try:
        Data_Sorting_mainpage()
    except Exception as e:
        print(f"An error occurred while processing main page: {e}")
