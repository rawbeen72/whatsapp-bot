const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

// API Configuration
const API_BASE = 'https://khalti.com/api/v2';
const API_TOKEN = config.khaltiToken;
const DEVICE_ID = 'kwa-d3d9b347-715e-45cf-bbbd-e608d08ff2ba';

const pendingTransactions = new Map();

class TransactionManager {
    static createAxiosInstance() {
        return axios.create({
            withCredentials: true,
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.8',
                'Content-Type': 'application/json',
                'DeviceId': DEVICE_ID,
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Sec-GPC': '1',
                'Referer': 'https://web.khalti.com/',
                'Origin': 'https://web.khalti.com',
                'sec-ch-ua': '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Linux"',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            }
        });
    }

    static async initiateLoad(userId, amount, bankCode) {
        try {
            const instance = this.createAxiosInstance();
            
            // Initialize session by visiting the main page first
            await instance.get('https://web.khalti.com/');
            let payload = {};
            if (bankCode.toUpperCase() === "CITIZEN"){
                 payload = {
                    remarks: "load fund from citizen",
                    amount: amount * 100,
                    account_id: config.citizenAccountId,
                    bank: config.citienCode
                };
            }
            else if (bankCode.toUpperCase() === "PRABHU"){
                payload = {
                    remarks: "load fund from prabhu",
                    amount: amount * 100,
                    account_id: config.prabhuAccountId,
                    bank: config.prabhuCode
                };
            }
            else{
                throw new Error('Invalid bank code');
            }

            const response = await instance.post(
                `${API_BASE}/bindtransaction/v2/load/`, 
                payload
            );

            // Store transaction details
            pendingTransactions.set(userId, {
                otpId: response.data.otp_id,
                amount: amount
            });

            return {
                success: true,
                message: 'Load initiated successfully'
            };

        } catch (error) {
            console.log(error);
            const errorData = error.response?.data;
            throw new Error(errorData?.detail || 'Failed to initiate load');
        }
    }

    static async verifyOTP(userId, code) {
        try {
            const transaction = pendingTransactions.get(userId);
            if (!transaction) {
                throw new Error('No pending transaction found');
            }

            const instance = this.createAxiosInstance();
            
            // Initialize session
            await instance.get('https://web.khalti.com/');

            const payload = {
                otp_id: transaction.otpId,
                context: "load",
                code: code.toString()
            };

            const response = await instance.post(
                `${API_BASE}/otpmodule/verify/`,
                payload
            );

            // Clean up pending transaction
            pendingTransactions.delete(userId);

            return {
                success: true,
                amount: transaction.amount,
                detail: "Fund loaded successfully",
                transactionId: response.data?.transaction_id
            };

        } catch (error) {
            const errorData = error.response?.data;
            logger.error(`OTP Verification Error: ${JSON.stringify(errorData)}`);
            throw new Error(errorData?.detail || 'OTP verification failed');
        }
    }
    static async transferFund(recipientNumber, amount) {
        try {
            const instance = this.createAxiosInstance();
            
            // Initialize session by visiting the main page first
            await instance.get('https://web.khalti.com/');

            const payload = {
                user: recipientNumber,
                amount: amount * 100, // Convert to paisa
                purpose: "Personal use",
                remarks: "Fund transfer"
            };

            const response = await instance.post(
                `${API_BASE}/fund/v2/offer/`,
                payload
            );

            // Format the response
            const balance = response.data.meta.balance;
            return {
                success: true,
                detail: response.data.detail,
                balance: (balance.primary / 100).toFixed(2), // Convert paisa to rupees with 2 decimal places
                transactionId: response.data.idx
            };

        } catch (error) {
            const errorData = error.response?.data;
            logger.error(`Fund Transfer Error: ${JSON.stringify(errorData)}`);
            throw new Error(errorData?.user?.[0] || errorData?.amount?.[0] || 'Fund transfer failed');
        }
    }

    static getPendingTransaction(userId) {
        return pendingTransactions.get(userId);
    }

    static clearPendingTransaction(userId) {
        return pendingTransactions.delete(userId);
    }
}

module.exports = TransactionManager;