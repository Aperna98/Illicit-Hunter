from web3 import Web3
from ens import ENS
import pandas as pd
import datetime
import requests

# Constants
INFURA_URL = "https://mainnet.infura.io/v3/c293321ef5e34025a1f71deb3756f3ab"  # Your Infura URL
API_KEY = "DPPG5TNXBBMN6S2QCDY4X5ABT6U5HVXZMF"  # Your Etherscan API Key
THRESHOLD = 0.1  # Suspicious value threshold in ETH

# Connect to Ethereum and ENS
web3 = Web3(Web3.HTTPProvider(INFURA_URL))
ns = ENS.from_web3(web3)

if web3.is_connected():
    print("Connected to Ethereum network!")
else:
    print("Failed to connect to Ethereum network.")
    exit()

# Step 1: Fetch transactions within a 2-second window
latest_block = web3.eth.get_block("latest", full_transactions=True)
transactions = []

start_time = datetime.datetime.fromtimestamp(latest_block["timestamp"], datetime.UTC)
end_time = start_time + datetime.timedelta(seconds=2)

print(f"Fetching transactions between {start_time} and {end_time}...")

current_block = latest_block
while True:
    block_time = datetime.datetime.fromtimestamp(current_block["timestamp"], datetime.UTC)

    if start_time <= block_time <= end_time:
        miner_address = current_block.get("miner", "Unknown")
        for tx in current_block["transactions"]:
            transactions.append({
                "hash": tx["hash"].hex(),
                "from": tx["from"],
                "to": tx["to"],
                "value": web3.from_wei(tx["value"], "ether"),
                "gas": tx["gas"],
                "timestamp": block_time.strftime("%Y-%m-%d %H:%M:%S"),
                "miner_address": miner_address
            })

    if block_time < start_time:
        break

    if current_block["number"] > 0:
        current_block = web3.eth.get_block(current_block["number"] - 1, full_transactions=True)
    else:
        break

df = pd.DataFrame(transactions)
df.to_csv("transactions.csv", index=False)
print("Transactions saved to transactions.csv")

# Step 2: Identify suspicious addresses
df["suspicious"] = (df["value"] > THRESHOLD) | (df["from"].duplicated(keep=False) | df["to"].duplicated(keep=False))
suspicious_addresses = set(df[df["suspicious"]]["from"].tolist() + df[df["suspicious"]]["to"].tolist())

# Save suspicious addresses as a single column
suspicious_addresses_df = pd.DataFrame({"address": list(suspicious_addresses)})
suspicious_addresses_df.to_csv("suspicious_addresses.csv", index=False)
print("Suspicious addresses saved to suspicious_addresses.csv")

# Step 3: Resolve ENS usernames for suspicious addresses
def resolve_username(address):
    if pd.isnull(address):
        return "N/A"
    name = ns.name(address)
    return name if name else address

# Resolve usernames only for suspicious addresses
suspicious_addresses_df["username"] = suspicious_addresses_df["address"].apply(resolve_username)
suspicious_addresses_df.to_csv("suspicious_addresses_with_usernames.csv", index=False)
print("Suspicious addresses with usernames saved to suspicious_addresses_with_usernames.csv")

# Step 4: Fetch transaction history for flagged addresses
def fetch_transaction_history(address):
    url = "https://api.etherscan.io/api"
    params = {
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 99999999,
        "page": 1,
        "offset": 100,
        "sort": "desc",
        "apikey": API_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if data["status"] == "1":
            return pd.DataFrame(data["result"])
        else:
            print(f"Error fetching data for {address}: {data['message']}")
            return pd.DataFrame()
    else:
        print(f"Failed to fetch data for {address}. HTTP Status code: {response.status_code}")
        return pd.DataFrame()

all_histories = []
for addr in suspicious_addresses:
    history_df = fetch_transaction_history(addr)
    if not history_df.empty:
        all_histories.append(history_df)

if all_histories:
    combined_history = pd.concat(all_histories, ignore_index=True)
    combined_history["timeStamp"] = pd.to_datetime(combined_history["timeStamp"].astype(int), unit="s")
    combined_history.to_csv("suspicious_transaction_histories.csv", index=False)
    print("Suspicious transaction histories saved to suspicious_transaction_histories.csv")
else:
    print("No transaction histories found for suspicious addresses.")
