pragma solidity ^0.4.23;

contract Lottery {

	address private _owner;
	address[] private _players;

	constructor() payable public {		
		_owner = msg.sender;		
	}

	function play() payable public {

		require(msg.value >= .01 ether, 'To play you need more than .01 ether');
		_players.push(msg.sender);
	}

    function getRandomUint() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, now, _players)));
    }

	function getRandomPlayer() private view returns (address) {

        require(_players.length > 0, 'Unable to get random player from empty collection.');

        if (_players.length == 1) {
			return _players[0];
		}
		else {
		    uint selector = getRandomUint() % _players.length;
	    	return _players[selector];
	    }
	}

    modifier onlyOwner{
        
        require(msg.sender == _owner, 'Only the manager can draw the lottery.');
        
        // Necessary construct. It's a placeholder for the compiler to inject all the
        // body of the calling function
        _;
    }
    
	function drawLottery() public onlyOwner {
	    require(_players.length > 0, 'Unable to draw lotter without any players.');

		address winner = getRandomPlayer();

        // Send ether to the winner
		winner.transfer(address(this).balance);
		
		// Resets players list (no elements inside of it)
		_players = new address[](0);
	}

	function getBalance() public view returns(uint) {
		return address(this).balance;
	}
	
	function getLotteryOwner() public view returns(address) {
		return _owner;
	}
	
	function getPlayers() public view returns (address[]) {
	    return _players;
	}
}