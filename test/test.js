const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const PERC20 = contract.fromArtifact('PERC20');

describe('PERC20', function () {
  const [ admin, authorized, otherAuthorized, other, otherAdmin ] = accounts;

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  const BURNER_ROLE = web3.utils.soliditySha3('BURNER_ROLE');
  const FREEZED_ROLE = web3.utils.soliditySha3('FREEZED_ROLE');
  

  before(async function () {
    this.PERC20 = await PERC20.new({ from: admin });
  });

  describe('default admin', function () {
    it('deployer has default admin role', async function () {
      expect(await this.PERC20.hasRole(DEFAULT_ADMIN_ROLE, admin)).to.equal(true);
    });

    it('deployer has minter role', async function () {
      expect(await this.PERC20.hasRole(MINTER_ROLE, admin)).to.equal(true);
    });

	it('deployer has burner role', async function () {
		expect(await this.PERC20.hasRole(BURNER_ROLE, admin)).to.equal(true);
	  });

    it('deployer has whitelister role', async function () {
      expect(await this.PERC20.hasRole(FREEZED_ROLE, admin)).to.equal(false);
    });
  });

  describe('granting', function () {
    // MINTER_ROLE
    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.PERC20.grantRole(MINTER_ROLE, authorized, { from: other }),
        'AccessControl: sender must be an admin to grant',
      );
    });

    it('admin can grant role to other accounts', async function () {
      const receipt = await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, role: MINTER_ROLE, sender: admin });

      expect(await this.PERC20.hasRole(MINTER_ROLE, authorized)).to.equal(true);
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });
      const receipt = await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });
      expectEvent.notEmitted(receipt, 'RoleGranted');
    });

    // BURNER_ROLE
    it('non-admin cannot grant role to other accounts', async function () {
      await expectRevert(
        this.PERC20.grantRole(BURNER_ROLE, authorized, { from: other }),
        'AccessControl: sender must be an admin to grant',
      );
    });

    it('admin can grant role to other accounts', async function () {
      const receipt = await this.PERC20.grantRole(BURNER_ROLE, authorized, { from: admin });
      expectEvent(receipt, 'RoleGranted', { account: authorized, role: BURNER_ROLE, sender: admin });

      expect(await this.PERC20.hasRole(BURNER_ROLE, authorized)).to.equal(true);
    });

    it('accounts can be granted a role multiple times', async function () {
      await this.PERC20.grantRole(BURNER_ROLE, authorized, { from: admin });
      const receipt = await this.PERC20.grantRole(BURNER_ROLE, authorized, { from: admin });
      expectEvent.notEmitted(receipt, 'RoleGranted');
    });
  });

  describe('mintingAndTransfering', function () {
    const mintAmount = new BN(10);
    const transferAmount = new BN(1);

    it('non-minter cant mint tokens', async function () {
        await expectRevert(
            this.PERC20.mint(authorized, mintAmount, { from: other }),
            'Caller is not a minter',
        );
    });

    it('non-whitelisted cant recieve tokens from mint', async function () {
      await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });  
      await this.PERC20.grantRole(FREEZED_ROLE, other, { from: admin });

        await expectRevert(
            this.PERC20.mint(other, mintAmount, { from: authorized }),
            'Must be whitelisted to recieve token',
        );
    });

    it('mint tokens', async function () {
        await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });
        await this.PERC20.revokeRole(FREEZED_ROLE, other, { from: admin });
        
        const receipt = await this.PERC20.mint(other, mintAmount, { from: authorized });
        await expectEvent(receipt, "Transfer", { from: '0x0000000000000000000000000000000000000000', to: other, value: mintAmount });

        var result = await this.PERC20.balanceOf(other, { from: other })
        expect(result.toString()).to.equal(mintAmount.toString());
    });

    it('non-whitelisted cant recieve tokens from transfer', async function () {
        await this.PERC20.grantRole(MINTER_ROLE, authorized, { from: admin });
        await this.PERC20.grantRole(FREEZED_ROLE, other, { from: admin });
        await this.PERC20.mint(authorized, mintAmount, { from: authorized });

        await expectRevert(
            this.PERC20.transfer(other, transferAmount, { from: authorized }),
            'Must be whitelisted to recieve token',
        );
    });

    it('transfer tokens', async function () {
        await this.PERC20.grantRole(MINTER_ROLE, otherAuthorized, { from: admin });
        await this.PERC20.revokeRole(FREEZED_ROLE, other, { from: admin });
        await this.PERC20.grantRole(BURNER_ROLE, other, { from: admin });
        var balance_other = await this.PERC20.balanceOf(other, {from: admin});
        await this.PERC20.burn(balance_other, { from: other });
        await this.PERC20.mint(otherAuthorized, mintAmount, { from: otherAuthorized });

        var receipt = await this.PERC20.transfer(other, transferAmount, { from: otherAuthorized })
        await expectEvent(receipt, "Transfer", { from: otherAuthorized, to: other, value: transferAmount });

        var result = await this.PERC20.balanceOf(other, { from: admin })
        expect(result.toString()).to.equal(transferAmount.toString());

        result = await this.PERC20.balanceOf(otherAuthorized, { from: admin })
        expect(result.toString()).to.equal("9");
    });
  });
});