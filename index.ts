import * as crypto from 'crypto';
import moment from 'moment';

class Transaction {
    constructor(
        public amount: number, 
        public payer: string, 
        public payee: string) {}
    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999);
    
    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
    ){}

    get Hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    public static instance = new Chain(); // Singleton Instance
    private userBalances: {[key: string]: number} = {};
    chain: Block[];

    constructor() {
        this.chain = [new Block('null', new Transaction(100, 'genesis', 'bitcoin'))] // genesis block to signify the creation of a new Chain
        
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('Mining Block...');

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer, receiverWallet: Wallet) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);
        const hasBalance = this.userBalances[transaction.payer] >= transaction.amount;
        if (isValid && hasBalance) {
            const newBlock = new Block(this.lastBlock.Hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
            this.userBalances[transaction.payer] -= transaction.amount;
            this.userBalances[transaction.payee] += transaction.amount;
        }
    }

    addMember(publicKey: string, balance: number) {
        this.userBalances[publicKey] = balance;
    }
}

class Wallet {
    public publicKey: string;
    private privateKey: string;

    constructor(balance: number) {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        })
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
        Chain.instance.addMember(this.publicKey, balance);
    }

    sendMoney(amount: number, receiverWallet: Wallet) {
        const transaction = new Transaction(amount, this.publicKey, receiverWallet.publicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature, receiverWallet);
    }
}

// Example usage

const UBC = new Wallet(50);
const McGill = new Wallet(0);
const UofT = new Wallet(0);

UBC.sendMoney(50, McGill);
McGill.sendMoney(23, UofT);
UofT.sendMoney(30, UBC);

console.log(Chain.instance);