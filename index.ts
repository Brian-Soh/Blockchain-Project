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

    public nonce = 0;
    
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

    addMember(publicKey: string, balance: number) {
        this.userBalances[publicKey] = balance;
    }

    mine(newBlock: Block) {
        let solution = 1;
        console.log('Mining Block...');
        let transaction = newBlock.transaction.toString();
        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((transaction + newBlock.prevHash + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                newBlock.nonce = solution;
                return;
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
            this.mine(newBlock);
            this.chain.push(newBlock);
            this.userBalances[transaction.payer] -= transaction.amount;
            this.userBalances[transaction.payee] += transaction.amount;
        }
    }

    verify() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const transaction = currentBlock.transaction.toString();
            const hash = crypto.createHash('MD5');
            hash.update((transaction + currentBlock.prevHash + currentBlock.nonce).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(0, 4) !== '0000') {
                console.log('Chain Valid: False') ;
                return;
            }
        }
        console.log('Chain Valid: True') ;
        console.log(Chain.instance);
        return;
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

Chain.instance.verify();

