import time
import os
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

 # --- CONFIGURATION ---
BASE_URL_TEMPLATE = "https://www.cpbl.com.tw/team/follow?Acnt={:010d}"  # zero-padded to 10 digits
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
OUTPUT_DIR = "member_past_record"
START_ID = 0
END_ID = 1000000  # adjust upper bound as needed


from selenium.webdriver.chrome.service import Service

def get_driver():
    chrome_options = Options()
    chrome_options.add_argument(f"user-agent={USER_AGENT}")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")

    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)



def get_soup(driver, url, wait=3):
    driver.get(url)
    time.sleep(wait)  # wait for JS to render
    return BeautifulSoup(driver.page_source, "html.parser")


def sanitize_filename(url):
    return re.sub(r'[^\w\-_]', '_', url.replace('https://', '').replace('http://', ''))


def extract_main_content(soup):
    main = soup.find("main")
    if not main:
        main = soup.body
    if not main:
        return ""
    return main.get_text(separator="\n", strip=True)


def save_as_xml(url, content):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    filename = sanitize_filename(url) + ".xml"
    filepath = os.path.join(OUTPUT_DIR, filename)
    root = ET.Element("page")
    url_elem = ET.SubElement(root, "url")
    url_elem.text = url
    content_elem = ET.SubElement(root, "content")
    content_elem.text = content
    tree = ET.ElementTree(root)
    tree.write(filepath, encoding="utf-8", xml_declaration=True)


def crawl_acnt_range(driver, start_id, end_id):
    for acnt_id in range(start_id, end_id + 1):
        url = BASE_URL_TEMPLATE.format(acnt_id)
        print(f"Crawling: {url}")
        try:
            soup = get_soup(driver, url)
            content = extract_main_content(soup)
            if not content.strip():
                print(f"Skipping empty page: {url}")
                continue
            save_as_xml(url, content)
        except Exception as e:
            print(f"Failed to load {url}: {e}")


def main():
    # Ensure output folder exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created folder: {OUTPUT_DIR}")

    driver = get_driver()
    try:
        print("Trying to crawl Acnt range", driver)
        crawl_acnt_range(driver, START_ID, END_ID)
    finally:
        driver.quit()
        


if __name__ == "__main__":
    main()
