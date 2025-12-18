import time
import os
import re
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# --- CONFIGURATION ---
BASE_URL = "https://www.espn.com/nba/"
PROXY = None  # Set to None or your proxy
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
OUTPUT_DIR = "test_data"


def get_driver():
    chrome_options = Options()
    chrome_options.add_argument(f"user-agent={USER_AGENT}")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    if PROXY:
        chrome_options.add_argument(f'--proxy-server={PROXY}')
    driver = webdriver.Chrome(ChromeDriverManager().install(), options=chrome_options)
    return driver


def get_soup(driver, url, wait=3):
    driver.get(url)
    time.sleep(wait)  # Wait for JS to load
    return BeautifulSoup(driver.page_source, "html.parser")


def is_internal_link(href, base_domain):
    if not href:
        return False
    parsed = urlparse(href)
    if parsed.netloc and parsed.netloc != base_domain:
        return False
    if href.startswith("javascript:") or href.startswith("#"):
        return False
    return True


def sanitize_filename(url):
    # Remove protocol and replace non-alphanum with _
    return re.sub(r'[^\w\-_]', '_', url.replace('https://', '').replace('http://', ''))


def extract_main_content(soup):
    # Try to extract main content, fallback to body text
    main = soup.find('main')
    if not main:
        main = soup.body
    if not main:
        return ""
    return main.get_text(separator='\n', strip=True)


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


def crawl_site(driver, base_url, max_pages=20000):
    visited = set()
    to_visit = [base_url]
    base_domain = urlparse(base_url).netloc
    count = 0
    while to_visit and count < max_pages:
        url = to_visit.pop(0)
        if url in visited:
            continue
        print(f"Crawling: {url}")
        try:
            soup = get_soup(driver, url)
        except Exception as e:
            print(f"Failed to load {url}: {e}")
            continue
        content = extract_main_content(soup)
        save_as_xml(url, content)
        visited.add(url)
        count += 1
        # Find new internal links
        for a in soup.find_all("a", href=True):
            href = a['href']
            if is_internal_link(href, base_domain):
                full_url = urljoin(base_url, href)
                if full_url not in visited and full_url not in to_visit:
                    to_visit.append(full_url)
    print(f"Crawling completed. {count} pages saved to {OUTPUT_DIR}/ as XML.")


def main():
    driver = get_driver()
    try:
        crawl_site(driver, BASE_URL)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()