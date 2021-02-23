// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol"; 


/**
 * @title TokenRecover
 * @dev Allow to recover any ERC20 sent into the contract for error
 */
contract TokenRecover is Ownable {

    /**
     * @dev Remember that only owner can call so be careful when use on contracts generated from other contracts.
     * @param tokenAddress The token contract address
     * @param tokenAmount Number of tokens to be sent
     */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) public onlyOwner {
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }
}


contract PERC20  is ERC20Capped, ERC20Burnable,ERC20Pausable, TokenRecover, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant FREEZED_ROLE = keccak256("FREEZED_ROLE");

    /**
     */
    constructor()
        ERC20Capped(100 * 1e20)
        ERC20("PERC20 Token", "PERC20")
    {
        uint8 decimals = 18;
        uint256 initialSupply = 1e18;

        _setupDecimals(decimals);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());

        if (initialSupply > 0) {
            _mint(owner(), initialSupply);
        }

    }


    function mint(address to, uint256 value) public {
        require(!hasRole(FREEZED_ROLE, to), "Must be whitelisted to recieve token");
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, value);
    }

    function burn(uint256 amount) public  
    virtual override(ERC20Burnable)
    {
        require(hasRole(BURNER_ROLE, _msgSender()), "Caller is not a burner");
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public  
    virtual override(ERC20Burnable)
    {
        require(hasRole(BURNER_ROLE, _msgSender()), "Caller is not a burner");
        _burn(account, amount);
    }

     /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) 
    internal 
    virtual override(ERC20, ERC20Capped, ERC20Pausable) 
    {
        require(!hasRole(FREEZED_ROLE, to), "Must be whitelisted to recieve token");
        require(!hasRole(FREEZED_ROLE, from), "Must be whitelisted to send token");
        super._beforeTokenTransfer(from, to, amount);
    }

}