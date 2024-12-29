const { Web3 } = require('web3');
const { MongoClient } = require('mongodb');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const etherscanApi = require('etherscan-api').init('DPPG5TNXBBMN6S2QCDY4X5ABT6U5HVXZMF');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');


// Ganache WebSocket URL
const web3 = new Web3('ws://127.0.0.1:7545');

// MongoDB Configuration
const MONGO_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'ganacheLogsDB';
const COLLECTION_NAME = 'transactions';

// CSV Writer Configuration
const csvWriter = createCsvWriter({
    path: 'transactions.csv',
    header: [
        { id: 'hash', title: 'Hash' },
        { id: 'from', title: 'From' },
        { id: 'to', title: 'To' },
        { id: 'value', title: 'Value (ETH)' },
        { id: 'gas', title: 'Gas' },
        { id: 'gasPrice', title: 'Gas Price (ETH)' }
    ]
});

const illegalCsvWriter = createCsvWriter({
    path: 'illegal_transactions.csv',
    header: [
        { id: 'hash', title: 'Hash' },
        { id: 'from', title: 'From' },
        { id: 'to', title: 'To' },
        { id: 'value', title: 'Value (ETH)' },
        { id: 'gas', title: 'Gas' },
        { id: 'gasPrice', title: 'Gas Price (ETH)' }
    ]
});

// Function to read addresses from CSV file
function readAddressesFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const addresses = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                addresses.push(row.Address);
            })
            .on('end', () => {
                resolve(addresses);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Function to get recent transactions
async function getRecentTransactions() {
    try {
        const transactions = await etherscanApi.proxy.eth_blockNumber();
        const blockNumber = transactions.result;
        const block = await etherscanApi.proxy.eth_getBlockByNumber(blockNumber, true);
        return block.result.transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Function to convert transactions to ETH and save to CSV
async function saveTransactionsToCsv(transactions) {
    const records = transactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: web3.utils.fromWei(tx.value, 'ether'),
        gas: tx.gas,
        gasPrice: web3.utils.fromWei(tx.gasPrice, 'ether')
    }));

    await csvWriter.writeRecords(records);
    console.log('Transactions saved to transactions.csv');
}

// Function to detect illegal transactions
function detectIllegalTransactions(transactions, illegalAddresses) {
    return transactions.filter(tx => illegalAddresses.includes(tx.from) || illegalAddresses.includes(tx.to));
}

// Function to save illegal transactions to CSV with retry mechanism
async function saveIllegalTransactionsToCsv(transactions, retries = 3) {
    const records = transactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: web3.utils.fromWei(tx.value, 'ether'),
        gas: tx.gas,
        gasPrice: web3.utils.fromWei(tx.gasPrice, 'ether')
    }));

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await illegalCsvWriter.writeRecords(records);
            console.log('Illegal transactions saved to illegal_transactions.csv');
            break;
        } catch (error) {
            if (error.code === 'EBUSY' && attempt < retries) {
                console.warn(`Attempt ${attempt} failed. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
            } else {
                console.error('Error saving illegal transactions:', error);
                break;
            }
        }
    }
}

// Example usage
(async () => {
    const etheaddresses = await readAddressesFromCsv('eth_addresses.csv');
    const illegalAddresses = new Set([...etheaddresses]);

    const recentTransactions = await getRecentTransactions();
    await saveTransactionsToCsv(recentTransactions);

    const illegalTransactions = detectIllegalTransactions(recentTransactions, Array.from(illegalAddresses));
    await saveIllegalTransactionsToCsv(illegalTransactions);
})();

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const io = socketIo(server);

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});