const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode} = require('../compile');

let accounts;
let contract;

beforeEach(async () => {
    // Grab list of accounts
    accounts = await web3.eth.getAccounts();
    
    // Use of those accounts to deploy
    // the contract
    contract = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode
        })
        .send({
            from: accounts[0],
            gas: '1000000'
        });

    contract.setProvider(provider);
});

describe('Contract Tests', () => {   

    it('Contract Deployment Test', () => {

        // Checks that the value 'address' exists
        assert.ok(contract.options.address);
    });

    it('Deployment Initialization Test', async () => {

        const ownerAddress = await contract.methods.getLotteryOwner().call();
        assert.equal(ownerAddress, accounts[0]);

        const balance = await contract.methods.getBalance().call();
        assert.ok(balance == 0);

    });

    it('Play Test', async () => {

        var transactionAddress = await contract.methods.play()
            .send({
                from: accounts[1],
                value: web3.utils.toWei('0.01', 'ether'),
                gas: '1000000'
            });
        
        console.log('Transaction Number', transactionAddress);

        var balance = await contract.methods.getBalance().call();
        assert.ok(balance > 0);

        var players = await contract.methods.getPlayers().call();
        assert.ok(players.length == 1);
        assert.ok(players[0] == accounts[1]);

        transactionAddress = await contract.methods.play()
            .send({
                from: accounts[2],
                value: web3.utils.toWei('0.01', 'ether'),
                gas: '1000000'
            });
        
        console.log('Transaction Number', transactionAddress);

        balance = await contract.methods.getBalance().call();
        assert.ok(balance == web3.utils.toWei('0.02', 'ether'), 'The jackpot must be of 0.02 ether.');

        players = await contract.methods.getPlayers().call();
        assert.ok(players.length == 2, 'There must be two players in the contract');
        assert.ok(players[1] == accounts[2], 'The second player must be the third account.');
    });
    
    it('Low Play Fee Test', async () => {

        try {
            await contract.methods.play()
                .send({
                    from: accounts[3],
                    value: web3.utils.toWei('0.0099', 'ether'),
                    gas: '1000000'
                });
                
            assert(false, 'No error was thrown for low paying fee.');
        }
        catch (err)
        {
            assert(err);
            console.log(err);
        }
    });

    it('Enforce ACLs Test', async () => {
        
        try {
            
            await contract.methods.drawLottery()
                .send({
                    from: accounts[1],
                    gas: '1000000'
                });
            
            assert(false, 'No error was thrown for trying to hack.');
        }
        catch (err)
        {
            assert(err);
            console.log(err);
        }
    });
    
    it('Draw Lottery Test', async () => {

        var transactionAddress = await contract.methods.play()
            .send({
                from: accounts[1],
                value: web3.utils.toWei('0.01', 'ether'),
                gas: '1000000'
            });

        transactionAddress = await contract.methods.play()
            .send({
                from: accounts[2],
                value: web3.utils.toWei('0.01', 'ether'),
                gas: '1000000'
            });
        
        const accountOneBalance = await web3.eth.getBalance(accounts[1]);
        console.log(accountOneBalance, 'Balance for account one');

        const accountTwoBalance = await web3.eth.getBalance(accounts[2]);
        console.log(accountTwoBalance, 'Balance for account two');

        const jackPot = await contract.methods.getBalance().call();
        console.log(jackPot, 'The jackpot before draw');
        
        await contract.methods.drawLottery()
                .send({
                    from: accounts[0],
                    gas: '1000000'
                });

        players = await contract.methods.getPlayers().call();
        assert.ok(players.length == 0, 'The pool of players must be emptied.');

        const jackPotAfterDraw = await contract.methods.getBalance().call();
        assert.ok(jackPotAfterDraw == 0, 'The jackpot must be taken.');

        const accountOneBalanceAfter = await web3.eth.getBalance(accounts[1]);
        const accountTwoBalanceAfter = await web3.eth.getBalance(accounts[2]);

        console.log(accountOneBalanceAfter, 'Balance for account one after');
        console.log(accountTwoBalanceAfter, 'Balance for account two after');

        const beforeDraw = parseInt(jackPot) + parseInt(accountOneBalance) + parseInt(accountTwoBalance);
        const afterDraw = parseInt(accountOneBalanceAfter) + parseInt(accountTwoBalanceAfter);
        const difference = beforeDraw - afterDraw;
        console.log(beforeDraw, 'beforeDraw');
        console.log(afterDraw, 'afterDraw');

        assert.ok(beforeDraw == afterDraw, 'An account must have been a winner');
    });    
});
