var ObjectID = require('mongodb').ObjectID;
var bitcore = require('bitcore');

const jwt = require('jsonwebtoken');
const secret = 'lanisters';

var Address = bitcore.address;
var hdPrivateKeys = [
	'xprv9s21ZrQH143K4E8g93RbL7F2PsZfzq6WmDTdVosui3xD5DvmaMzTGaMYP1HkEDRjPFc1hwDFCApUzb4TJvHLvbpxp15fbMB3Zon4yQQ4fut',
	'xprv9s21ZrQH143K2yNcycUEYWgJA97ZQTKuBk7TToapfx6obNhV6RTu7UDshUKPKtouzxT3XewFZ5pJzBeDXaYL8Kr8AdbjVfFK2B8fwtBKSFV',
	'xprv9s21ZrQH143K2bR5tXjAsNvPDr894YYHS4j7bvtCyjd8QxetPuArwJbahRzzSZtjiMg4pjS63MLPWPjjcf39aDSGLdBPRX9XHoN82rQTiZC'
];

var hdPublicKeys = [];

module.exports = function(app,db){
	//Login
	app.post('/login', (req, res) => {
		//Mock user details received from post. 
		//Save token locally and add to Header Bearer <token> in subsequent API calls
		const user = {
			id: 1,
			username: 'Tyrion',
			email: 'tyrion.l@gmail.com' 
		}

		jwt.sign({user}, secret, (err, token) => {
			res.json({
				token
			})
		})
	})

	//generate a 2-of-3 multisig P2SH address
	app.get('/generate_address', verifyToken, (req, res) => {
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: 'You are an imposter, only Lanisters have access to Kings Landing API'
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
					error: 'You are an imposter, only Lanisters have access to Kings Landing API'
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
					error: 'You are an imposter, only Lanisters have access to Kings Landing API'
				})
			}else{
				var HDPrivateKey = bitcore.HDPrivateKey;

				for (var i = hdPrivateKeys.length - 1; i >= 0; i--) {
					
					var hdPrivateKey = new HDPrivateKey(hdPrivateKeys[i]);

					// derive HDPublicKey using BIP32 path https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
					hdPublicKeys[i] = hdPrivateKey.hdPublicKey.derive("m/44'/1'/0'/0/0").publicKey;
				}

				//Number of public keys required needed to generate a bitcoin address i.e 2/3
				var requiredSignatures = 2;

				var address = new bitcore.Address(hdPublicKeys, requiredSignatures);

				res.json({
					address: address.toString()
				})
			}
		})
	})

	//create transaction
	app.post('/transaction', verifyToken, (req, res) =>{
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: 'You are an imposter, only Lanisters have access to Kings Landing API'
				})
			}else{


			}
		})
	})

	//create transaction
	app.post('/transaction_old', verifyToken, (req, res) =>{
		jwt.verify(req.token, secret, (err, authData) => {
			if(err){
				res.json({
					error: 'You are an imposter, only Lanisters have access to Kings Landing API'
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

				var transaction = new bitcore.Transaction()
			    .from(utxo)
			    .to(to_address, amount)
			    .sign(privateKey);

			    res.json({
					transaction: transaction
				})
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