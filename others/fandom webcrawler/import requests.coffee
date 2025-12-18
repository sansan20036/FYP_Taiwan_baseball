import requests

def get_player_stats(player_id, season):
    # Example uses MLB Stats API (public, no key required)
    url = f"https://statsapi.mlb.com/api/v1/people/{player_id}/stats"
    params = {
        "stats": "gameLog",
        "season": season
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        # Extract game logs
        game_logs = data.get('stats', [])[0].get('splits', [])
        for game in game_logs:
            date = game['date']
            stats = game['stat']
            print(f"Date: {date}, Stats: {stats}")
    else:
        print(f"Error: {response.status_code}")

# Example usage: Mike Trout (player_id=545361), 2023 season
get_player_stats(545361, 2023)