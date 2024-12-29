# ILLICIT-HUNTER
Unmasking Illicit Transfers in Blockchain Ecosystems

**Ethereum Suspicious Transaction Monitor**
This repository contains tools for analyzing Ethereum transactions, identifying suspicious activity, and visualizing transaction data using an interactive chart.

**FEATURES**
1. Blockchain Connectivity: Connects to the Ethereum blockchain via Infura or Ganache.
2. Suspicious Transaction Detection: 
    Identifies transactions with a value greater than a specified threshold (default: 0.1 ETH). 
    Flags addresses involved in multiple transactions within a specified time window.
3. ENS Resolution: Resolves Ethereum addresses to human-readable ENS names, where available.
4. Transaction History: Fetches complete transaction histories for flagged addresses from Etherscan.
5. Interactive Chart: Visualizes transaction data as a bar chart showing transaction counts and total amounts for address pairs.
6. CSV Output:
    transactions.csv: All transactions fetched within the time window.
    suspicious_addresses.csv: Suspicious addresses identified during the analysis.
    suspicious_addresses_with_usernames.csv: Suspicious addresses with resolved ENS usernames.
    suspicious_transaction_histories.csv: Complete transaction history for suspicious addresses.

**REQUIREMENTS**
1. Python (for backend analysis): Python 3.7+ (Dependencies: web3, pandas, requests, ethereum-ens)
    --> Install the Python dependencies using: pip install web3 pandas requests ethereum-ens
2. HTML/JavaScript (for frontend visualization): 
    A modern web browser.
    Internet connection for external libraries (e.g., Chart.js, ethers.js).

**SETUP**
Python Backend
1. Clone the repository: git clone https://github.com/Aperna98/Illicit-Hunter.git
                         cd Illicit-Hunter
2. Replace the placeholders in the Python script (main.py) with your credentials:
      Infura Project ID: Replace YOUR_INFURA_PROJECT_ID with your Infura project ID.
      Etherscan API Key: Replace YOUR_ETHERSCAN_API_KEY with your Etherscan API key
3. Run the script: python main.py

HTML Frontend
1. Open the file transaction_analysis_chart.html in your browser.
2. The chart will automatically connect to your local Ethereum provider (e.g., Ganache) to fetch transaction data.
3. The bar chart visualizes:
            Transaction Count: Number of transactions for each address pair.
            Total Amount (ETH): Total ETH transferred between each address pair.

**OUTPUT FILES**
1. Backend Outputs
    transactions.csv: All transactions fetched during the execution.
    suspicious_addresses.csv: Identified suspicious addresses in a single-column format.
    suspicious_addresses_with_usernames.csv: Suspicious addresses with resolved ENS usernames.
    suspicious_transaction_histories.csv: Complete transaction history for flagged addresses fetched via the Etherscan API.

2. Frontend Output
    An interactive bar chart visualized directly in your browser.
    
**HOW IT WORKS**
Python Backend Workflow
  1. Connect to Ethereum: Uses Infura to connect to the Ethereum mainnet or Ganache for local testing.
  2. Fetch Transactions: Retrieves the latest transactions in a specified time window (2 seconds).
  3. Identify Suspicious Activity: 
        Flags transactions based on: 
            Value greater than 0.1 ETH (modifiable). 
            Addresses that send or receive ETH multiple times.
  4. Resolve ENS Names: Resolves human-readable ENS names for suspicious addresses.
  5. Fetch Transaction Histories: Uses the Etherscan API to fetch the full transaction history of suspicious addresses.

HTML Frontend Workflow
  1. Fetch Data: Connects to a local Ethereum provider (e.g., Ganache) using ethers.js.
  2. Aggregate Transactions: 
      Groups transactions by address pairs (from → to) and calculates: 
          Total transaction count. 
          Total amount of ETH transferred.
  3. Visualize Data: Displays transaction data using a bar chart powered by Chart.js.
  
**NOTES**
  1. Ensure your Infura project ID and Etherscan API key are valid and active.
  2. Use Ganache for local testing of the HTML file by running a local blockchain.
  3. The HTML file relies on external JavaScript libraries:
      ethers.js: For Ethereum interaction.
      Chart.js: For chart visualization.


