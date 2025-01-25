# Blockchain Project

## Introduction
My first encounter with Bitcoin was in Grade 7 when it amassed media coverage due to its price peaking at $21k before dropping below $7k which caused panic among crypto enthusiasts. My best friend and I took advantage of that opportunity to buy it at a low price and began mining for it on my desktop. At the time, "mining" and "hashes" were just buzzwords to me, but this project gave me the opportunity to explore the implementation of blockchain technology and the theory behind cryptographic signatures and proof of work. This project uses the Crypto node module to create and digest hashes as well as verify signatures. 

## Classes
**Transaction**
- Keeps track of the amount, payer and payee of each transaction

**Block**
- Has a nonce which is the solution which generates a hash that starts with 4 zeroes when appended to the transaction and the previous hash

**Chain**
- Follows the Singleton design pattern so there is only one instance 
- userBalances is hash map which keeps track of all accounts
- Initialization creates a "Genesis" block which signifies the start of the chain
- addMember function initializes new user on the block chain with their starting amount. This prevents amendments to account balances from being called from the users themselves.
- mine function solves for a solution which generates a hash that starts with 4 zeroes when appended to the transaction and the previous hash
- addBlock is in charge of verifying each transaction by ensuring that the signature provided by the sender matches the transaction. This then verifies that the sender has sufficient funds before appending the block and transferring the amount.
- verify loops through the Blocks in the Chain and verifies each hash solution

**Wallet**
- has a publicKey which acts as a username and a privateKey which is used to create a signature
- sendMoney is the only function it has access to, but the block chain verifies if the transaction is valid

## Example Usage
I have provided an example which includes the creation of 3 new wallets: UBC, McGill and UofT. In the first two transactions, they go through as the accounts have sufficient funds, but the third is invalid. The verify function is then called on the chain to ensure that the blocks are valid and prints the transaction history if they are.

## Potential Improvement
Rather than keeping the balances in the Chain class, I could instead keep each Wallet's balance in the class itself which gives it access to giving itself money. This would creates a discrepancy between the Wallet and the Chain which causes the verify function to fail, mirroring the reality of block chains like Bitcoin. 
