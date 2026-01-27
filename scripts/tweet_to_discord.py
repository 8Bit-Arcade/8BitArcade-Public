import requests
import os
import re

# ---------------- CONFIG ----------------
X_USERNAME = "8_Bit_Arcade_"  # X account to track
LAST_TWEET_FILE = ".last_tweet"
# ---------------------------------------

# Read webhook from environment variable (secure)
DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK")
if not DISCORD_WEBHOOK:
    raise ValueError("DISCORD_WEBHOOK not set in environment variables!")

def get_last_tweet_id():
    if os.path.exists(LAST_TWEET_FILE):
        with open(LAST_TWEET_FILE, "r") as f:
            return f.read().strip()
    return None

def set_last_tweet_id(tweet_id):
    with open(LAST_TWEET_FILE, "w") as f:
        f.write(tweet_id)

def fetch_latest_tweets():
    # Use a working RSS feed (RSS.app or other)
    rss_url = f"https://rss.app/feeds/MIpcEv6eV8BVwpXI.xml"  # Replace with your RSS feed
    try:
        r = requests.get(rss_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"[!] Failed to fetch tweets: {e}")
        return None

def parse_rss_items(rss_xml):
    """
    Returns list of tuples: (tweet_id, full_text, tweet_url)
    """
    items = re.findall(r"<item>.*?<link>(https://twitter.com/.+?/status/(\d+))</link>.*?<description><!\[CDATA\[(.*?)\]\]></description>.*?</item>", rss_xml, re.DOTALL)
    return [(id, text, url.replace("https://twitter.com", "https://x.com")) for url, id, text in items][::-1]  # oldest first

def post_to_discord(tweet_text, tweet_url):
    data = {
        "username": "8Bit Arcade 🕹️",
        "avatar_url": "https://8bitarcade.games/images/8bit-logo.png",
        "content": f"{tweet_text}\n{tweet_url}"
    }
    try:
        resp = requests.post(DISCORD_WEBHOOK, json=data)
        if resp.status_code == 204:
            print(f"[+] Posted successfully: {tweet_url}")
        else:
            print(f"[!] Failed to post: {resp.status_code}, {resp.text}")
    except Exception as e:
        print(f"[!] Exception posting to Discord: {e}")

def main():
    last_tweet = get_last_tweet_id()
    rss = fetch_latest_tweets()
    if not rss:
        print("[!] No RSS data, exiting.")
        return

    items = parse_rss_items(rss)
    new_items = []
    for tweet_id, text, url in items:
        if tweet_id == last_tweet:
            break
        new_items.append((tweet_id, text, url))

    if not new_items:
        print("[*] No new tweets to post.")
        return

    for tweet_id, text, url in new_items:
        post_to_discord(text, url)

    # Save the latest tweet ID
    set_last_tweet_id(new_items[0][0])
    print("[*] Done.")

if __name__ == "__main__":
    main()
