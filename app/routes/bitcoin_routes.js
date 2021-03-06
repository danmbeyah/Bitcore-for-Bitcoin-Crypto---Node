var ObjectID = require('mongodb').ObjectID;
var bitcore = require('bitcore');
//var Insight = require('bitcore-explorers').Insight;

const jwt = require('jsonwebtoken');
const secret = 'lanisters';

const error_msg = 'You are an imposter, only Lanisters have access to Kings Landing API at the moment';
/* 
 * derive HDPublicKey for this address using BIP32 path https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * m/purpose/coin_type/account/change/address_index
 * coint_type 0=Bitcoin 1=Bitcoin Testnet, account=a/c or user id
 */
const path = "m/44/1/0/0/0";
const pathChange = "m/44/1/0/1/0";

var Address = bitcore.address;
var Networks = bitcore.network;

var UnspentOutput = bitcore.Transaction.UnspentOutput;

//Generated using /generate_hd_private_keys API. Generate these on the fly (using path) and not as implemented here.
const hdPrivateKeys = [
	"xprv9s21ZrQH143K3PyFnjECi5h582c2Jy1C2tArHAQrxRhfEhkofL4btQCH24vQ9QaLoiwdnNkdNDjntBa1EiCaJaGnx1Qng6byc58HZW9dH1r",
	"xprv9s21ZrQH143K3VNPdhHXBt9UMbtB3mykBXVmEsfyF1a6M9S3DMqWPzj7zDMtNEQu5N6yGkB86oFQ3fWsRThQ8S5jnXcP3sMJP1qU9QNc9Du",
	"xprv9s21ZrQH143K2Vmrq4KEQaNXiZ6UfCzJvuCABQcTv2VZfTz2ekkrt6At9ZUScqETr7dZu3iBKBAacBwtg6wcaJUtYQ61qUo6w3TsYXSCBoZ"
];

var publicKeys = [];
var privKeys = [];

var changePublicKeys = [];
var changePrivKeys = [];

module.exports = function(app,db){
	//Login
	app.post('/login', (req, res) => {
		//Mock user details received from post. 
		//Add token to Header Bearer <token> in subsequent API calls
		const user = {
			id: 1,
			username: 'Tyrion',
			email: 'tyrion.l@gmail.com' 
		}

		jwt.sign({user}, secret, (err, token) => {
			res.json({
				Token: token
			})
		})
	})

	//generate a 2-of-3 multisig P2SH address
	app.get('/generate_address', verifyToken, (req, res) => {
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				var publicKeys = [
				  '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
				  '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
				  '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9'
				];
				var requiredSignatures = 2;

				var address = new bitcore.Address(publicKeys, requiredSignatures).toString();

				console.log(address);

				res.json({
					address: address
				})
			}
		})
	})

	//generate HD private Keys
	app.get('/generate_hd_private_keys', verifyToken, (req, res) => {
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				var HDPrivateKey = bitcore.HDPrivateKey;

				var hdPrivateKey = new HDPrivateKey();

				res.json({
					HD_private_key: hdPrivateKey.toString()
				})
			}
		})
	})

	//generate a 2-of-3 bitcoin address using HD Keys
	app.get('/generate_address_hd', verifyToken, (req, res) => {
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				var HDPrivateKey = bitcore.HDPrivateKey;

				for (var i = hdPrivateKeys.length - 1; i >= 0; i--) {
					
					var privateKey = new HDPrivateKey(hdPrivateKeys[i]);
					
					publicKeys[i] = privateKey.hdPublicKey.derive(path).publicKey;
					privateKeys[i] = privateKey;
					privKeys[i] = privateKey.privateKey;
				}

				//Number of public keys required to generate a bitcoin address i.e 2/3
				var requiredSignatures = 3;

				var address = new bitcore.Address(publicKeys, requiredSignatures, 'testnet');

				res.json({
					Bitcoin_address: address.toString(),
					Public_Keys: publicKeys,
					Private_Keys: privateKeys,
					Priv_Keys: privKeys
				})
			}
		})
	})

	//create multisig transaction
	app.post('/transaction1', verifyToken, (req, res) =>{
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				var to_address = req.body.to_address;
				var amount = req.body.amount*1;
				var HDPrivateKey = bitcore.HDPrivateKey;

				for (var i = hdPrivateKeys.length - 1; i >= 0; i--) {
					
					var hdPrivatekey = new HDPrivateKey(hdPrivateKeys[i]);
					
					publicKeys[i] = hdPrivatekey.hdPublicKey.derive(path).publicKey;
					//privateKeys[i] = privatekey;
					privKeys[i] = hdPrivatekey.derive(path).privateKey;

					//Change Address Keys
					changePublicKeys[i] = hdPrivatekey.hdPublicKey.derive(pathChange).publicKey;
					changePrivKeys[i] = hdPrivatekey.derive(pathChange).privateKey;
				}

				//Number of public keys required to generate a bitcoin address i.e 2/3
				var requiredSignatures = 3;

				//Generate change address
				var address = new bitcore.Address(publicKeys, requiredSignatures, 'testnet');
				var changeAddress = new bitcore.Address(changePublicKeys, requiredSignatures, 'testnet');

				/*var utxo = {
				  "txId" : "153068cdd81b73ec9d8dcce27f2c77ddda12dee3db424bff5cafdbe9f01c1756",
				  "outputIndex" : 0,
				  "address" : address.toString(),
				  "script" : new bitcore.Script(address).toHex(),
				  "satoshis" : amount
				};*/

				var utxo = new UnspentOutput({
				  "txId" : "c8547f4594e8cb43c39d85a147a76514e1131652be42ddf6b4ffb50aed600fae",
				  "outputIndex" : 0,
				  "address" : address.toString(),
				  "script" : "a91471a7c8013ddde7ccec603cf450816e428813e0da87",
				  "satoshis" : amount
				});

				var multiSigTx = new bitcore.Transaction()
				    .from(utxo, publicKeys, requiredSignatures)
				    .to(to_address, 90000)
				    .change(changeAddress.toString())
				    .fee(50000)
				    .sign(privKeys);

				    console.log(multiSigTx.toString());

				    console.log(multiSigTx.serialize());

				res.json({
					Serialize: multiSigTx.toObject()
				})
			}
		})
	})

	//create transaction
	app.post('/transaction', verifyToken, (req, res) =>{
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				var from_address = req.body.from_address;
				var to_address = req.body.to_address;
				var amount = req.body.amount*1;
				var privateKey = new bitcore.PrivateKey('L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy');
				var utxo = {
				  "txId" : "115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986",
				  "outputIndex" : 0,
				  "address" : "17XBj6iFEsf8kzDMGQk5ghZipxX49VXuaV",
				  "script" : "76a91447862fe165e6121af80d5dde1ecb478ed170565b88ac",
				  "satoshis" : 50000
				};

				var tx = new bitcore.Transaction()
			    .from(utxo)
			    .to(to_address, amount)
			    .change(from_address)
			    .fee(50000)
			    .sign(privateKey);

			    res.json({
					transaction: tx.toObject()
				})
			}
		})
	})

	//validate address
	app.post('/validate_address', verifyToken, (req, res) =>{
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: error_msg
				})
			}else{
				
			}
		})
	})

	//verify token
	//Token format Authorization: Bearer <authToken> from frontend or Postman
	function verifyToken(req, res, next){
		//Get auth header value
		const bearerHeader = req.headers['authorization'];

		//check if bearerHeader is defined
		if(typeof bearerHeader !=='undefined'){
			//Split Bearer <authToken> at space
			const bearer = bearerHeader.split(' ');
			//Get token from array
			const bearerToken = bearer[1];
			//Add token to request object
			req.token = bearerToken;
			//Call next middleWare
			next();
		}else{
			//forbidden, can't access APIs
			res.json({
				error: 'White walkers are kept off by the wall...get an ice dragon or talk to Snow for access'
			})
		}
	}
}