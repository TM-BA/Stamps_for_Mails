//    TestStamp ERC20 Token for the Ethereum network
//    Copyright (C) 2019  Timo Meilinger (timo@meilinger.app)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Affero General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Affero General Public License for more details.
//
//    You should have received a copy of the GNU Affero General Public License
//    along with this program.  If not, see <https://www.gnu.org/licenses/>.<?xml version="1.0"?> 

//  Implements EIP20 token standard: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md

pragma solidity ^0.4.21;

import "./EIP20Interface.sol";

contract TestStamp is EIP20Interface {
uint256 constant private MAX_UINT256 = 2**256 - 1;
mapping (address => uint256) public balances;
mapping (address => mapping (address => uint256)) public allowed;

string public name;                   //Name of the Token
uint8 public decimals;                //How many decimals to show.
string public symbol;                 //Identifier of the Token

function TestStamp() public {
balances[msg.sender] = 1000000000000;		// Give the creator all initial tokens
totalSupply = 1000000000000;						// Update total supply
name = "TestStamp";										// Set the name for display purposes
decimals = 0;													// Amount of decimals for display purposes
symbol = "TSTAMP";										// Set the symbol for display purposes
}

function transfer(address _to, uint256 _value) public returns (bool success) {
require(balances[msg.sender] >= _value);
balances[msg.sender] -= _value;
balances[_to] += _value;
emit Transfer(msg.sender, _to, _value);
return true;
}

function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
uint256 allowance = allowed[_from][msg.sender];
require(balances[_from] >= _value && allowance >= _value);
balances[_to] += _value;
balances[_from] -= _value;
if (allowance < MAX_UINT256) {
allowed[_from][msg.sender] -= _value;
}
emit Transfer(_from, _to, _value);
return true;
}

function balanceOf(address _owner) public view returns (uint256 balance) {
return balances[_owner];
}

function approve(address _spender, uint256 _value) public returns (bool success) {
allowed[msg.sender][_spender] = _value;
emit Approval(msg.sender, _spender, _value);
return true;
}

function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
return allowed[_owner][_spender];
}
}