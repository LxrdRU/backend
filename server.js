const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const clarifai = require('clarifai');
const appKey = new Clarifai.App({
  apiKey:'032e76a123a5484ca3613ecae12015e1'
});
const db = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DATABASE_URL,
    ssl : true
  }
});

db.select('*').from('users').then(data =>{
	console.log(data);
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/imageurl', (req, res) =>{
appKey.models
	.predict(Clarifai.CELEBRITY_MODEL, req.body.input)
	.then(data =>{
		res.json(data);
	})
	.catch(err => res.status(400).json('API is down'))
})

app.get('/', (req, res) => {
	res.send('its working');
})

app.post('/signin', (req, res) =>{
	const {email, password} = req.body;
	
	db.select('email', 'hash').from('login')
		.where('email', '=', email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid){
				return db.select('*').from('users')
					.where('email', '=', email)
					.then(user => {
						res.json(user[0])
					})
					.catch(err => res.status(400).json('cant get the user'))
			} else {
				res.status(400).json('wrong credentials')
			}
		})
		.catch(err => res.status(400).json('wrong credentials'))
})
app.post('/register', (req, res)=>{

	const { email, name, password } = req.body;
	if (!email || !name || !password){
		return res.status(400).json('incorrect form submission');
	}
	const hash = bcrypt.hashSync(password);
		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email:email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
				return trx('users')
					.returning('*')
					.insert({
						email: loginEmail[0],
						name: name,
						joined: new Date()
					})
					.then(response =>{
						res.json(response[0]);
					})
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
		.catch(err => res.status(400).json('unable to register'))
})
app.get('/profile/:id', (req, res) =>{
	const {id} = req.params;
	db.select('*').from('users').where({id: id})
	.then(user => {
	if(user.legth){
		rse.json(user[0]);
	}else{
		res.status(400).json('Not found');
	}
	})
	.catch(err => res.status(400).json('error getting the user'))
})
app.put('/image', (req, res) =>{
	const {id} = req.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries =>{
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('cant get entries'))
})

app.listen(process.env.PORT || 3000, ()=> {
  console.log('app is running on port ${process.env.PORT}');
})


