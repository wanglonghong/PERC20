const PERC20 = artifacts.require('PERC20');


module.exports = async function (deployer, network, accounts) {

  deployer.deploy(PERC20);

};
