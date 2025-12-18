import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
import re
import time



def sanitize_filename(title):
    return re.sub(r'[\\/*?:"<>|]', "", title).strip().replace(" ", "_")

def is_valid_fandom_link(href, base_domain):
    if not href:
        return False
    parsed = urlparse(href)
    return (parsed.netloc == "" or parsed.netloc == base_domain) and not href.startswith('#')

def crawler(base_url, file_name):
    visited = set()
    to_visit = [base_url]
    data = []

    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    base_scheme = parsed_base.scheme
    base_prefix = f"{base_scheme}://{base_domain}"

    # Set up output
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_dir = os.path.join(script_dir, file_name)
    os.makedirs(html_dir, exist_ok=True)

    output_csv = f"fandom_links_full_{int(time.time())}.csv"
    output_path = os.path.join(script_dir, output_csv)

    print("Saving HTML files to:", html_dir)
    print("Saving CSV to:", output_path)

    while to_visit:
        url = to_visit.pop(0)
        if url in visited:
            continue

        print(f"Crawling: {url}")
        visited.add(url)

        try:
            response = requests.get(url)
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            continue

        if response.status_code != 200:
            print(f"Failed to fetch {url} (Status {response.status_code})")
            continue

        soup = BeautifulSoup(response.text, 'html.parser')

        # Save HTML
        title_tag = soup.find('h1')
        title_text = title_tag.text.strip() if title_tag else 'page'
        filename = sanitize_filename(title_text) + ".html"
        filepath = os.path.join(html_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(response.text)

        # Extract summary (first paragraph)
        paragraph = soup.find('p')
        summary = paragraph.text.strip() if paragraph else 'No summary available'

        # Save metadata
        data.append({
            'Title': title_text,
            'URL': url,
            'Summary': summary
        })

        # Extract and queue new links
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(url, href)

            if is_valid_fandom_link(href, base_domain) and full_url.startswith(base_prefix):
                if full_url not in visited and full_url not in to_visit:
                    to_visit.append(full_url)

        time.sleep(1)  # Delay to avoid server overload

    # Save metadata
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"\nFinished crawling {len(visited)} pages.")
    print(f"Metadata saved to {output_path}")

if __name__ == "__main__":
    fandom_url = "https://www.rebas.tw/tournament/CPBL-2025-JO/firstbase/Kae1X"  
    crawler(fandom_url, file_name="baseball_rebas_html_files")
